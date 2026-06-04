// content reading time
const readingTime = (content) => {
  const WPS = 275 / 60;

  let images = 0;
  // Кириллица + латиница + цифры
  const regex = /[a-zA-Zа-яА-ЯёЁ0-9_]/;

  let words = content.split(" ").filter((word) => {
    if (word.includes("<img")) {
      images += 1;
    }
    return regex.test(word);
  }).length;

  let imageAdjust = images * 4;
  let imageSecs = 0;
  let imageFactor = 12;

  while (images) {
    imageSecs += imageFactor;
    if (imageFactor > 3) {
      imageFactor -= 1;
    }
    images -= 1;
  }

  const minutes = Math.ceil(((words - imageAdjust) / WPS + imageSecs) / 60);

  return minutes + ` мин.`;
};

export default readingTime;
