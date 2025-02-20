const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs").promises;

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.set("view engine",'ejs');

// Update root route to use async/await
app.get("/", async (req, res) => {
    try {
        const files = await fs.readdir('./files');
        res.render("index", { files });
    } catch (err) {
        console.error('Error reading directory:', err);
        res.status(500).send('Error loading notes');
    }
});

// Update file view route to use async/await
app.get("/files/:filename", async (req, res) => {
    try {
        const data = await fs.readFile(`./files/${req.params.filename}`, "utf-8");
        res.render("show", {
            filename: req.params.filename,
            data: data
        });
    } catch (err) {
        console.error('Error reading file:', err);
        res.status(500).send('Error loading note');
    }
});

// Update create route to use async/await
app.post("/create", async (req, res) => {
    try {
        const filename = `${req.body.Title.split(" ").join("")}.txt`;
        await fs.writeFile(`./files/${filename}`, req.body.Description);
        res.redirect("/");
    } catch (err) {
        console.error('Error creating file:', err);
        res.status(500).send('Error creating note');
    }
});

// Update update route to use async/await
app.post("/update/:filename", async (req, res) => {
    try {
        const newContent = req.body.Description;
        await fs.writeFile(`./files/${req.params.filename}`, newContent);
        res.redirect("/");
    } catch (err) {
        console.error('Error updating file:', err);
        res.status(500).send('Error updating note');
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
app.post('/rename/:filename', async (req, res) => {
    try {
        const oldPath = path.join(__dirname, 'files', req.params.filename);
        let newFilename = req.body.newFilename;

        if (!newFilename.endsWith('.txt')) {
            newFilename += '.txt';
        }

        const newPath = path.join(__dirname, 'files', newFilename);

        // Check if files exist using async operations
        try {
            await fs.access(oldPath);
        } catch {
            return res.status(404).json({
                success: false,
                message: 'Original file not found'
            });
        }

        try {
            await fs.access(newPath);
            return res.status(400).json({
                success: false,
                message: 'A note with this name already exists'
            });
        } catch {
            // File doesn't exist, we can proceed
        }

        await fs.rename(oldPath, newPath);
        res.json({
            success: true,
            message: 'File renamed successfully',
            newFilename: newFilename
        });

    } catch (error) {
        console.error('Rename error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rename file. Please try again.'
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

// Start the server
app.listen(1234, () => {
    console.log("Server running at http://localhost:1234");
}).on("error", (err) => {
    console.error("Server error:", err);
});

