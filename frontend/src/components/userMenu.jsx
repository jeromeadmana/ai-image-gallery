const UserMenu = ({ email }) => {
  return (
    <span className="text-gray-700 font-medium">
      {email || ""}
    </span>
  );
};

export default UserMenu;
