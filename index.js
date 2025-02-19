const express= require("express");
const app= express();
const path=require("path");
const fs=require("fs").promises; // Using promises version for better async handling

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.set("view engine",'ejs');

app.get("/",(req,res)=>{
    fs.readdir(`./files`,(err,files)=>{
        res.render("index",{files:files});
    });
        
});
app.get("/files/:filename",(req,res)=>{
    fs.readFile(`./files/${req.params.filename}`,"utf-8",(err,data)=>{
        res.render("show",{filename:req.params.filename,data:data});
    });
        
});
app.post("/create",(req,res)=>{
    console.log(req.body);
    fs.writeFile(`./files/${req.body.Title.split(" ").join("")}.txt`,req.body.Description,(err)=>{
        if(err){
         res.errored(err);
        }else{
            res.redirect("/");
        }
    })

});

app.post("/update/:filename", (req, res) => {
    const newContent = req.body.Description;
    fs.writeFile(`./files/${req.params.filename}`, newContent, (err) => {
        if(err) {
            res.send(err);
        } else {
            res.redirect("/");
        }
    });
});

// Update your delete route to handle AJAX request
app.post("/delete/:filename", (req, res) => {
    const filePath = path.join(__dirname, 'files', req.params.filename);
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Failed to delete file' });
        }
        res.status(200).json({ success: true, message: 'File deleted successfully' });
    });
});

// Update the rename route to use callbacks instead of sync operations
app.post('/rename/:filename', (req, res) => {
    try {
        const oldPath = path.join(__dirname, 'files', req.params.filename);
        let newFilename = req.body.newFilename;

        // Add .txt extension if not present
        if (!newFilename.endsWith('.txt')) {
            newFilename += '.txt';
        }

        const newPath = path.join(__dirname, 'files', newFilename);

        // Check if source file exists
        if (!fs.existsSync(oldPath)) {
            return res.status(404).json({
                success: false,
                message: 'Original file not found'
            });
        }

        // Check for duplicate filename
        if (fs.existsSync(newPath)) {
            return res.status(400).json({
                success: false,
                message: 'A note with this name already exists'
            });
        }

        // Perform the rename
        fs.renameSync(oldPath, newPath);

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

app.listen(3000,()=>{
    console.log("server running at http:localhost:3000 ");
});

