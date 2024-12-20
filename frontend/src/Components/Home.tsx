import "./Home.css";

type HomeProps = {
  onSelect: (choice: "home" | "file-upload") => void;
};

const Home = ({ onSelect }: HomeProps) => {
  return (
    <div className="home-container">
      <h1>Welcome to FileShare!</h1>
      <p className="intro-text">
        Seamlessly share your files with friends, family, or colleagues. Fast, secure, and simple file sharing at your fingertips.
      </p>

      <div className="feature-list">
        <ul>
          <li>⚡ Instant File Uploads</li>
          <li>🌐 Connect with Any Device via Codes</li>
          <li>🚀 Super Fast & User-Friendly</li>
        </ul>
      </div>

      <p className="cta-text">
        Ready to get started? Click the button below to upload and share your first file.
      </p>
      <button className="file-button" onClick={() => onSelect("file-upload")}>
        Share a File
      </button>
    </div>
  );
};

export default Home;