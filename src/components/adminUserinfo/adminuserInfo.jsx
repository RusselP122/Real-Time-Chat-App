import "./adminUserInfo.css";

const AdminUserInfo = () => {
  // Fetch admin details from localStorage
  const adminName = localStorage.getItem("adminName") || "ADMIN"; // Default to "ADMIN" if not set
  const adminAvatar = localStorage.getItem("adminAvatar") || "/avatar.png"; // Default avatar

  return (
    <div className="adminUserInfo">
      <div className="admin">
        <img src={adminAvatar} alt="Admin Avatar" /> {/* Admin Avatar */}
        <h2>{adminName}</h2> {/* Display Admin Name */}
      </div>
      <div className="adminIcons">
       
      </div>
    </div>
  );
};

export default AdminUserInfo;
