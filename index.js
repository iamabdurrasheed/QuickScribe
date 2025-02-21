const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Note = require("./models/Note");
const app = express();
const path = require("path");
const fs = require("fs").promises;
const debug = require('debug')('mynotes:server');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.set("view engine",'ejs');

// Add MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/mynotes', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    debug('MongoDB connected successfully');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Authentication middleware
const requireAuth = async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).send('Server error');
    }
};

// Apply requireAuth to protected routes
app.use(['/notes', '/new', '/files'], requireAuth);

// Update the root route - remove requireAuth
app.get('/', (req, res) => {
    // If user is already logged in, redirect to notes
    if (req.session.userId) {
        res.redirect('/notes');
    } else {
        // Show landing page for non-authenticated users
        res.render('landing');
    }
});

// Authentication routes
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.get('/guide', (req, res) => {
    res.render('guide');
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { error: null });
});

// Registration handler
app.post('/register', async (req, res) => {
    try {
        const { username, password, confirmPassword } = req.body;

        // Validation
        if (!username || !password || !confirmPassword) {
            return res.render('register', { error: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.render('register', { error: 'Passwords do not match' });
        }

        // Check for existing user
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('register', { error: 'Username already exists' });
        }

        // Create new user
        const user = new User({ username, password });
        await user.save();

        // Auto login after registration
        req.session.userId = user._id;
        res.redirect('/notes');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { error: 'Error during registration' });
    }
});

// Update login handler
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.render('login', { error: 'Invalid credentials' });
        }

        req.session.userId = user._id;
        res.redirect('/notes');
    } catch (error) {
        res.render('login', { error: 'Server error' });
    }
});

// Add logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Auth routes
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).send('Invalid credentials');
        }

        req.session.userId = user._id;
        res.redirect('/');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Update the notes route to fetch user-specific notes
app.get('/notes', requireAuth, async (req, res) => {
    try {
        // Verify user session
        if (!req.session.userId) {
            return res.redirect('/login');
        }

        // Fetch user's notes
        const notes = await Note.find({ 
            userId: req.session.userId 
        })
        .sort({ updatedAt: -1 })
        .lean()
        .exec();

        if (!notes) {
            console.error('Failed to fetch notes');
            return res.status(500).render('error', { 
                message: 'Failed to fetch notes' 
            });
        }

        // Render the notes page
        res.render('index', { 
            notes: notes,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });

    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).render('error', { 
            message: 'An error occurred while fetching notes' 
        });
    }
});

// Update the show note route
app.get("/notes/:noteId", requireAuth, async (req, res) => {
    try {
        const [note, user] = await Promise.all([
            Note.findOne({
                _id: req.params.noteId,
                userId: req.session.userId
            }),
            User.findById(req.session.userId)
        ]);

        if (!note) {
            return res.redirect('/notes');
        }

        // Format the date before sending
        const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Not available';

        res.render("show", {
            note: note,
            user: {
                username: user.username,
                memberSince: memberSince
            }
        });
    } catch (err) {
        console.error('Error:', err);
        res.redirect('/notes');
    }
});

// Replace the existing create route with this:
app.post("/create", requireAuth, async (req, res) => {
    try {
        const note = new Note({
            userId: req.session.userId,
            title: req.body.Title,
            content: req.body.Description,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await note.save();
        res.redirect("/notes");
    } catch (err) {
        console.error('Error creating note:', err);
        res.status(500).send('Error creating note');
    }
});

// Update or replace the existing rename route
app.post('/rename/:noteId', requireAuth, async (req, res) => {
    try {
        const { newFilename } = req.body;
        const noteId = req.params.noteId;

        // Validation
        if (!newFilename || !newFilename.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title cannot be empty'
            });
        }

        // Update the note
        const updatedNote = await Note.findOneAndUpdate(
            { 
                _id: noteId,
                userId: req.session.userId 
            },
            { 
                title: newFilename.trim(),
                updatedAt: new Date()
            },
            { 
                new: true,
                runValidators: true 
            }
        );

        if (!updatedNote) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        res.json({
            success: true,
            newTitle: updatedNote.title,
            message: 'Note renamed successfully'
        });

    } catch (error) {
        console.error('Error renaming note:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rename note'
        });
    }
});

// Update delete route to use async/await
app.post("/delete/:filename", async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'files', req.params.filename);
        await fs.unlink(filePath);
        res.status(200).json({ 
            success: true, 
            message: 'File deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete file' 
        });
    }
});

// Update rename route to use async/await

// Add delete route
app.delete('/notes/:noteId', requireAuth, async (req, res) => {
    try {
        const result = await Note.findOneAndDelete({
            _id: req.params.noteId,
            userId: req.session.userId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete note'
        });
    }
});

// Update the favorites route
app.get('/favorites', requireAuth, async (req, res) => {
    try {
        const notes = await Note.find({
            userId: req.session.userId,
            isFavorite: true
        }).sort({ updatedAt: -1 });

        res.json({ success: true, notes });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch favorites' 
        });
    }
});

// Add toggle favorite route
app.post('/toggle-favorite/:noteId', requireAuth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.noteId,
            userId: req.session.userId
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        note.isFavorite = !note.isFavorite;
        await note.save();

        res.json({
            success: true,
            isFavorite: note.isFavorite
        });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle favorite'
        });
    }
});

app.get("/new", (req, res) => {
    res.render("new");
});

// Make sure the files directory exists
(async () => {
    try {
        await fs.access('./files');
    } catch {
        await fs.mkdir('./files');
        console.log('Created files directory');
    }
})();

// Add these routes after your existing routes

// Profile routes
app.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('profile', { 
            user,
            error: req.query.error,
            success: req.query.success
        });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Update username
app.post('/profile/update-username', requireAuth, async (req, res) => {
    try {
        const { newUsername, password } = req.body;
        const user = await User.findById(req.session.userId);

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.redirect('/profile?error=Invalid password');
        }

        // Check if username is taken
        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
            return res.redirect('/profile?error=Username already taken');
        }

        // Update username
        user.username = newUsername;
        await user.save();
        res.redirect('/profile?success=Username updated successfully');
    } catch (error) {
        res.redirect('/profile?error=Failed to update username');
    }
});

// Change password
app.post('/profile/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const user = await User.findById(req.session.userId);

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.redirect('/profile?error=Invalid current password');
        }

        // Verify new passwords match
        if (newPassword !== confirmNewPassword) {
            return res.redirect('/profile?error=New passwords do not match');
        }

        // Update password
        user.password = newPassword;
        await user.save();
        res.redirect('/profile?success=Password changed successfully');
    } catch (error) {
        res.redirect('/profile?error=Failed to change password');
    }
});

// Delete account
app.post('/profile/delete-account', requireAuth, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.session.userId);

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.redirect('/profile?error=Invalid password');
        }

        // Delete user's notes
        const userNotes = await Note.find({ userId: user._id });
        for (const note of userNotes) {
            await Note.findByIdAndDelete(note._id);
        }

        // Delete user
        await User.findByIdAndDelete(user._id);
        req.session.destroy();
        res.redirect('/login?message=Account deleted successfully');
    } catch (error) {
        res.redirect('/profile?error=Failed to delete account');
    }
});

// Forgot password
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.render('forgot-password', { error: 'No account found with this email' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email (implement your email sending logic here)
        
        res.render('forgot-password', { success: 'Password reset instructions sent to your email' });
    } catch (error) {
        res.render('forgot-password', { error: 'Failed to process request' });
    }
});

// Update your route handler to include user data
app.get('/notes/:id', requireAuth, async (req, res) => {
    try {
        // Fetch both note and user data
        const [note, user] = await Promise.all([
            Note.findOne({
                _id: req.params.id,
                userId: req.session.userId
            }),
            User.findById(req.session.userId, 'username') // Only fetch username
        ]);

        if (!note) {
            return res.redirect('/notes');
        }

        res.render('show', {
            note,
            user: {
                username: user.username
            }
        });

    } catch (err) {
        console.error('Error:', err);
        res.redirect('/notes');
    }
});

// Add update note route
app.post('/update/:noteId', requireAuth, async (req, res) => {
    try {
        const { Description } = req.body;
        const noteId = req.params.noteId;

        // Update the note
        const updatedNote = await Note.findOneAndUpdate(
            { 
                _id: noteId,
                userId: req.session.userId 
            },
            { 
                content: Description,
                updatedAt: new Date()
            },
            { 
                new: true,
                runValidators: true 
            }
        );

        if (!updatedNote) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        res.json({
            success: true,
            message: 'Note updated successfully'
        });

    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update note'
        });
    }
});

// Start the server
app.listen(1234, () => {
    console.log("Server running at http://localhost:1234");
}).on("error", (err) => {
    console.error("Server error:", err);
});

