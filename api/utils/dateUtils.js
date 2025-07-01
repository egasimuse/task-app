// Helper function to format date for MySQL DATE column
const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Gets YYYY-MM-DD format
};

module.exports = {
  formatDateForMySQL
};
