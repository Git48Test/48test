import React, { useState, useEffect } from "react";

function Admin() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState({}); // Track which users are being edited
  const [updatedDetails, setUpdatedDetails] = useState({}); // Store updated details for each user

  const fetchUsers = async () => {
    try {
      const response = await fetch("/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Error fetching users.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (userId, updatedDetails) => {
    try {
      const response = await fetch(`/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedDetails),
      });
      const data = await response.json();
      setMessage(data.message);
      // Refresh users list after updating
      fetchUsers();
    } catch (err) {
      setMessage("Error updating user.");
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await fetch(`/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setMessage(data.message);
      // Refresh users list after deleting
      fetchUsers();
    } catch (err) {
      setMessage("Error deleting user.");
    }
  };

  const handleInputChange = (userId, field, value) => {
    setUpdatedDetails((prevDetails) => ({
      ...prevDetails,
      [userId]: {
        ...prevDetails[userId],
        [field]: value,
      },
    }));
  };

  return (
    <div>
      <h2>Admin Page</h2>
      <h3>All Users:</h3>
      {users.map((user, index) => (
        <div key={index}>
          {editing[user._id] ? (
            <>
              <input
                value={updatedDetails[user._id]?.username || user.username}
                onChange={(e) =>
                  handleInputChange(user._id, "username", e.target.value)
                }
              />
              <input
                value={
                  updatedDetails[user._id]?.accountType || user.accountType
                }
                onChange={(e) =>
                  handleInputChange(user._id, "accountType", e.target.value)
                }
              />
              <button
                onClick={() => {
                  updateUser(user._id, updatedDetails[user._id]);
                  setEditing((prevEditing) => ({
                    ...prevEditing,
                    [user._id]: false,
                  }));
                }}
              >
                Save
              </button>
              <button
                onClick={() =>
                  setEditing((prevEditing) => ({
                    ...prevEditing,
                    [user._id]: false,
                  }))
                }
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <p>Username: {user.username}</p>
              <p>Account Type: {user.accountType}</p>
              <button
                onClick={() =>
                  setEditing((prevEditing) => ({
                    ...prevEditing,
                    [user._id]: true,
                  }))
                }
              >
                Edit
              </button>
              <button onClick={() => deleteUser(user._id)}>Delete</button>
            </>
          )}
        </div>
      ))}
      <p>{message}</p>
    </div>
  );
}

export default Admin;
