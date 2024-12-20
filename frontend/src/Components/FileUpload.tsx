import React, { useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import "./FileUpload.css";

interface FileUploadProps {
  onGoBack: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onGoBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [UploadCode, setUploadCode] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [expirationTime, setExpirationTime] = useState(10); // Default expiration time in minutes

  const [retrieveCode, setRetrieveCode] = useState("");
  const [retrieving, setRetrieving] = useState(false);
  const [fileData, setFileData] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [retrieveStatus, setRetrieveStatus] = useState("");
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  /** Handle File Upload **/
  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select a file to upload!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB!");
      return;
    }

    setUploading(true);
    setUploadError("");
    setLink("");
    setUploadCode("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("expirationTime", String(expirationTime)); // Include expiration time

      const response = await axios.post("${REACT_APP_BACKEND_URL}/upload", formData);
      setLink(response.data.link);
      setUploadCode(response.data.expirationCode);
    } catch {
      setUploadError("Failed to upload the file! Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /** Handle File Retrieval **/
  const handleRetrieve = async () => {
    if (!retrieveCode) {
      setRetrieveStatus("Please enter a valid expiration code!");
      return;
    }

    setRetrieving(true);
    setRetrieveStatus("");

    try {
      const response = await axios.get(`${BACKEND_URL}/retrieve/${retrieveCode}`, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = "downloaded-file";

      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="?([^"]+)"?/);
        if (matches?.[1]) filename = matches[1];
      }

      setFileData(response.data);
      setFileName(filename);

      setRetrieveStatus("File ready for download!");
    } catch {
      setRetrieveStatus("Failed to retrieve file. Please check the code and try again!");
    } finally {
      setRetrieving(false);
    }
  };

  const handleDownload = () => {
    if (!fileData) return;

    const url = window.URL.createObjectURL(fileData);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="file-upload-container">
      <h2>Upload File</h2>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <label>
        Expiration Time (in minutes):{" "}
        <input
          type="number"
          value={expirationTime}
          onChange={(e) => setExpirationTime(Number(e.target.value))}
          min={1}
          max={1440} // 24 hours max
        />
      </label>
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {uploadError && <p className="error">{uploadError}</p>}
      {link && (
        <div>
          <p>
            File Link:{" "}
            <a href={link} target="_blank" rel="noopener noreferrer">
              {link}
            </a>
          </p>
          <p>Expiration Code: {UploadCode}</p>
          <QRCode value={link} />
        </div>
      )}

      <hr />

      <h2>Retrieve File</h2>
      <input
        type="text"
        placeholder="Enter Expiration Code"
        value={retrieveCode}
        onChange={(e) => setRetrieveCode(e.target.value)}
      />
      <button onClick={handleRetrieve} disabled={retrieving}>
        {retrieving ? "Retrieving..." : "Retrieve"}
      </button>
      {retrieveStatus && <p>{retrieveStatus}</p>}
      {fileData && (
        <div>
          <h3>{fileName}</h3>
          <button onClick={handleDownload}>Download</button>
        </div>
      )}

      <button onClick={onGoBack} className="back-button">
        Go Back
      </button>
    </div>
  );
};

export default FileUpload;
