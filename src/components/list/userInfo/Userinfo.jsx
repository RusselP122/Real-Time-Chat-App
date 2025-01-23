import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";

const Userinfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser?.avatar || "./avatar.png"} alt="User avatar" />
        <h2>{currentUser?.name || "Guest"}</h2> {/* Display user's name */}
      </div>
      <div className="icons">
        <img src="./more.png" alt="More options" />
        <img src="./video.png" alt="Start video call" />
        <img src="./edit.png" alt="Edit profile" />
      </div>
    </div>
  );
};

export default Userinfo;
