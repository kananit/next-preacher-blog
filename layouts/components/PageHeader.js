import Badge from "@layouts/components/Badge";

const PageHeader = ({ badge, title, meta }) => {
  return (
    <div className="mb-10">
      <Badge>{badge}</Badge>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="h2">{title}</h1>
        {meta && (
          <span className="text-sm text-text dark:text-darkmode-text">
            {meta}
          </span>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
