const StatusCell = ({ value }) => {
  return (
    <div className="flex justify-center">
      <div
        className={`h-3 w-3 rounded-full ${
          value
            ? "bg-green-500"
            : "bg-red-500"
        }`}
      />
    </div>
  );
};

export default StatusCell;