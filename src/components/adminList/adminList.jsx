import AdminChatList from "./adminChatList/AdminChatList"; // Import admin-specific chat list
import "./adminlist.css"; // Admin-specific styles
import AdminUserInfo from "./adminUserInfo/AdminUserInfo"; // Import admin-specific user info

const AdminList = () => {
    return (
        <div className="adminList">  
            <AdminUserInfo /> {/* Admin user info */}
            <AdminChatList /> {/* Admin chat list */}
        </div>
    );
};

export default AdminList;
