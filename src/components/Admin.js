import React, { useState, useEffect } from "react";

function Admin() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
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

    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Admin Page</h2>
      <h3>All Users:</h3>
      {users.map((user, index) => (
        <div key={index}>
          <p>Username: {user.username}</p>
          <p>Account Type: {user.accountType}</p>
        </div>
      ))}
      <p>{message}</p>
    </div>
  );
}

export default Admin;
