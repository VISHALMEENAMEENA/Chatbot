import React from "react";
import UserList from "./UserList"; // Import UserList component

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Welcome to your Dashboard!</h2>
      <p>This is where user-specific content will be displayed.</p>
      
      {/* Add the UserList component here */}
      <UserList />
    </div>
  );
};

export default Dashboard;
