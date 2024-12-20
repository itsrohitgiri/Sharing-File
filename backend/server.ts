import express, { Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import crypto from "crypto";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Restrict CORS to frontend URL (you can replace '*' with your frontend's URL on Vercel)
  methods: ['GET', 'POST'],
}));

// Automatically create 'uploads/' directory
const uploadDirectory = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
  console.log("Created 'uploads/' directory");
}

// In-memory mapping: expiration code => file info
interface FileMapping {
  filename: string;
  originalname: string;
  expirationTimeout: NodeJS.Timeout;
}
const fileMapping: { [key: string]: FileMapping } = {};

// Storage configuration using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

let FILE_EXPIRATION_TIME = 10 * 60 * 1000; // Default: 10 minutes

// Endpoint to update file expiration time
app.post("/set-expiration-time", (req: Request, res: Response) => {
  const { expirationTimeInMinutes } = req.body;

  if (!expirationTimeInMinutes || isNaN(expirationTimeInMinutes) || expirationTimeInMinutes <= 0) {
    res.status(400).json({ message: "Invalid expiration time! Must be a positive number." });
    return;
  }

  FILE_EXPIRATION_TIME = expirationTimeInMinutes * 60 * 1000; // Convert minutes to milliseconds
  res.json({
    message: `File expiration time set to ${expirationTimeInMinutes} minutes.`,
  });
});

function cleanupOldFiles() {
  fs.readdir(uploadDirectory, (err, files) => {
    if (err) {
      console.error("Failed to read uploads directory:", err);
      return;
    }

    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(uploadDirectory, file);
      
      // Get file's creation time
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Failed to get stats for file: ${file}`, err);
          return;
        }

        const fileAge = now - stats.birthtimeMs; // File age in milliseconds
        if (fileAge > FILE_EXPIRATION_TIME) {
          // Delete the expired file
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Failed to delete file: ${file}`, err);
            } else {
              console.log(`Deleted expired file: ${file}`);
            }
          });
        }
      });
    });
  });
}

// Call the cleanup function on server startup
cleanupOldFiles();



// Endpoint: File Upload
app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    res.status(400).send("No file uploaded!");
    return;
  }

  // Generate unique expiration code
  const expirationCode = crypto.randomBytes(4).toString("hex");

  // Save the mapping with a timer for file expiration
  const timeout = setTimeout(() => {
    const { filename } = fileMapping[expirationCode];
    const filePath = path.join(uploadDirectory, filename);

    // Delete the file and remove from the mapping
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete file: ${filename}`, err);
      } else {
        console.log(`Deleted expired file: ${filename}`);
      }
    });
    delete fileMapping[expirationCode];
  }, FILE_EXPIRATION_TIME);

  fileMapping[expirationCode] = {
    filename: file.filename,
    originalname: file.originalname,
    expirationTimeout: timeout,
  };

const link = `${PORT}/uploads/${file.filename}`;

  res.json({
    message: "File uploaded successfully!",
    expirationCode,
    link,
  });
});

// Endpoint: Retrieve File by Code
app.get("/retrieve/:code", (req: Request, res: Response) => {
  const { code } = req.params;

  if (!fileMapping[code]) {
    res.status(404).json({ message: "Invalid or expired code!" });
    return;
  }

  const { filename, originalname } = fileMapping[code];
  const filePath = path.join(uploadDirectory, filename);

  // Send the file for download
  res.download(filePath, originalname, (err) => {
    if (err) {
      res.status(500).send("Error downloading file!");
    }
  });
});

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDirectory));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
