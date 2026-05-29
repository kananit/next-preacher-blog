const EmptyState = ({ icon, title, description }) => {
  return (
    <div className="rounded-lg p-12 text-center">
      {icon && (
        <svg
          className="mx-auto mb-4 h-16 w-16 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icon}
        </svg>
      )}
      <h3 className="h4 mb-2">{title}</h3>
      {description && (
        <p className="text-text dark:text-darkmode-text">{description}</p>
      )}
    </div>
  );
};

export default EmptyState;
