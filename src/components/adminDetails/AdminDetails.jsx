import "./adminDetails.css";
import DeleteGroupModal from "./DeleteGroupModal";
import { useState, useEffect } from "react";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../lib/chatStore ";

const AdminDetails = () => {
  const { chatID } = useChatStore();
  const [members, setMembers] = useState([]);
  const [groupName, setGroupName] = useState("Group Chat");
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [showPhotos, setShowPhotos] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for controlling the delete modal


  // Fetch group data (members and group name)
  useEffect(() => {
    if (!chatID) return;

    const fetchGroupData = async () => {
      try {
        const groupRef = doc(db, "groupChats", chatID);
        onSnapshot(groupRef, async (groupSnap) => {
          if (groupSnap.exists()) {
            const groupData = groupSnap.data();
            setGroupName(groupData.groupName || "Group Chat");
            const memberIds = groupData.members || [];

            // Fetch member names based on their IDs
            const memberDetails = await Promise.all(
              memberIds.map(async (memberId) => {
                const userRef = doc(db, "users", memberId);
                const userSnap = await getDoc(userRef);
                return userSnap.exists() ? userSnap.data().name : "Unknown User";
              })
            );

            setMembers(memberDetails);
          }
        });
      } catch (error) {
        console.error("Error fetching group data:", error);
      }
    };

    fetchGroupData();
  }, [chatID]);

  // Fetch shared photos and files
  useEffect(() => {
    if (!chatID) return;

    const fetchChatData = async () => {
      try {
        const chatRef = doc(db, "chats", chatID);
        onSnapshot(chatRef, (chatSnap) => {
          if (!chatSnap.exists()) {
            setSharedPhotos([]);
            setSharedFiles([]);
            return;
          }

          const chatData = chatSnap.data();
          const messages = chatData.messages || [];

          const photos = messages
            .filter((message) => message.img)
            .map((message) => ({
              url: message.img,
              name: message.text || "Shared Image",
            }));

          const files = messages
            .filter((message) => message.file)
            .map((message) => ({
              url: message.file.url,
              name: message.file.name || "Untitled File",
            }));

          setSharedPhotos(photos);
          setSharedFiles(files);
        });
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    };

    fetchChatData();
  }, [chatID]);

  const handleLogout = () => {
    auth.signOut().then(() => {
      console.log("Admin logged out");
      localStorage.removeItem("isAdmin");
      navigate("/admin");
    });
  };

  const openModal = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
    setIsModalOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!chatID) return;
  
    try {
      // Reference to the group chat document
      const groupRef = doc(db, "groupChats", chatID);
  
      // Delete the group chat document
      await deleteDoc(groupRef);
  
      // Optionally, delete the associated chat document from 'chats' collection
      const chatRef = doc(db, "chats", chatID);
      await deleteDoc(chatRef);
  
      console.log("Group chat deleted successfully.");
    } catch (error) {
      console.error("Error deleting group chat:", error);
    }
  };
    

  return (
    
    <div className="admin-detail">
      <div className="group-info">
        <h2>{groupName}</h2>
        <p>{`Members: ${members.length}`}</p>
      </div>

      <div className="members-list">
        <h3>Group Members</h3>
        {members.length > 0 ? (
          <ul>
            {members.map((memberName, index) => (
              <li key={index} className="member-item">
                <span>{memberName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No members added yet.</p>
        )}
      </div>

      {/* Shared Photos Section */}
      <div className="option">
        <div className="title" onClick={() => setShowPhotos(!showPhotos)}>
          <span>Shared Photos</span>
          <img src={showPhotos ? "./../arrowDown.png" : "./../arrowUp.png"} alt="Toggle" />
        </div>

        {showPhotos && (
          <div className="photos">
            {sharedPhotos.length > 0 ? (
              sharedPhotos.map((photo, index) => (
                <div className="photoItem" key={index} onClick={() => openModal(photo.url)}>
                  <div className="photoDetail">
                    <img src={photo.url} alt="Shared" />
                    <span>{photo.name}</span>
                  </div>
                </div>
              ))
            ) : (
              <p>No photos shared yet</p>
            )}
          </div>
        )}
      </div>

      {/* Shared Files Section */}
      <div className="option">
        <div className="title" onClick={() => setShowFiles(!showFiles)}>
          <span>Shared Files</span>
          <img src={showFiles ? "./../arrowDown.png" : "./../arrowUp.png"} alt="Toggle" />
        </div>

        {showFiles && (
          <div className="files">
            {sharedFiles.length > 0 ? (
              sharedFiles.map((file, index) => (
                <div className="fileItem" key={index}>
                  <div className="fileIcon">
                    <img src="./../icon.png" alt="File Icon" />
                    <a href={file.url} download target="_blank" rel="noopener noreferrer" className="fileLink">
                      {file.name}
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p>No files shared yet</p>
            )}
          </div>
        )}
      </div>

      <button className="delete-group" onClick={() => setIsDeleteModalOpen(true)}>
        Delete Group
      </button>
      <button className="admin-logout" onClick={handleLogout}>
        Log Out
      </button>

      {/* Delete Confirmation Modal */}
      <DeleteGroupModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleDeleteGroup();
          setIsDeleteModalOpen(false);
        }}
      />

      {/* Modal for viewing photos */}
      {isModalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modalContent">
            <img src={selectedPhoto} alt="Full View" />
          </div>
        </div>
      )}
    </div>

    
    
  );
};

export default AdminDetails;
