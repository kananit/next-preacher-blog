// config/sections.js — единый источник данных о разделах (posts, notes и т.д.)
// Используется в категориях, страницах постов и везде, где нужна информация о разделах

import { FaBook, FaBookOpen } from "react-icons/fa";

const SECTIONS = [
  {
    id: "posts",
    name: "Проповеди",
    icon: FaBook,
    iconClass: "text-primary",
    linkColor: "text-primary hover:text-primary/80",
  },
  {
    id: "notes",
    name: "Конспекты",
    icon: FaBookOpen,
    iconClass: "text-primary",
    linkColor: "text-primary hover:text-primary/80",
  },
];

export const getSectionIds = () => SECTIONS.map((s) => s.id);

export const getSectionMeta = (sectionId) => {
  return SECTIONS.find((s) => s.id === sectionId) || SECTIONS[0];
};

export default SECTIONS;
