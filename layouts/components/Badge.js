const Badge = ({ children }) => {
  return (
    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary dark:bg-primary/20">
      {children}
    </span>
  );
};

export default Badge;
