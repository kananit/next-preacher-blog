import Logo from "@components/Logo";
import menu from "@config/menu.json";
import socical from "@config/social.json";
import Social from "@layouts/components/Social";
import ThemeSwitcher from "@layouts/components/ThemeSwitcher";
import SearchModal from "@partials/SearchModal";
import Link from "next/link";
import React, { useState } from "react";
import { IoSearch } from "react-icons/io5";

const Header = () => {
  const { main } = menu;
  const [searchModal, setSearchModal] = useState(false);

  return (
    <header className="header">
      <nav className="navbar container px-1 sm:px-8">
        <div className="flex w-full items-center gap-1.5 sm:gap-2 lg:gap-0">
          <Logo />

          {/* Nav items - inline on mobile, spaced on desktop */}
          <ul className="flex min-w-0 items-center gap-1 lg:ml-6 lg:flex-1 lg:gap-2 xl:gap-4">
            {main.map((menu, i) => (
              <li className="nav-item" key={`menu-${i}`}>
                <Link
                  href={menu.url}
                  className="nav-link block whitespace-nowrap"
                >
                  {menu.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side controls */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-4">
            <Social source={socical} className="socials hidden lg:flex" />
            <ThemeSwitcher />
            <div
              className="search-icon"
              onClick={() => setSearchModal(true)}
            >
              <IoSearch />
            </div>
          </div>
        </div>
        <SearchModal
          searchModal={searchModal}
          setSearchModal={setSearchModal}
        />
      </nav>
    </header>
  );
};

export default Header;
