// Заголовок секции: капс с трекингом + линия-акцент в фирменном цвете
const SectionHeading = ({ children, className = "" }) => {
  return (
    <h2
      className={`mb-5 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-dark dark:text-darkmode-light ${className}`}
    >
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-primary/25" />
    </h2>
  );
};

export default SectionHeading;
