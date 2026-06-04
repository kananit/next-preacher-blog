import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";

const SearchModal = ({ searchModal, setSearchModal }) => {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        const input = document.getElementById("searchModal");
        const value = input?.value?.trim();
        if (!value) return;
        router.push({ pathname: "/search", query: { key: value } });
        setSearchModal(false);
      }
      if (e.key === "Escape") {
        setSearchModal(false);
      }
    },
    [router, setSearchModal]
  );

  useEffect(() => {
    if (!searchModal) return;

    const input = document.getElementById("searchModal");
    input?.focus();

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchModal, handleKeyDown]);

  return (
    <div className={`search-modal ${searchModal ? "open" : ""}`}>
      <button onClick={() => setSearchModal(false)} className="search-close">
        <IoCloseCircleOutline />
      </button>
      <input
        type="text"
        className="form-input bg-body placeholder:text-base dark:bg-darkmode-body"
        id="searchModal"
        placeholder="текст + enter..."
      />
    </div>
  );
};

export default SearchModal;
