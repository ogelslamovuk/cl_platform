export const FALLBACK_TITLE = "Event Pass Hub";

export const ROUTE_TITLES: Record<string, string> = {
  "/": FALLBACK_TITLE,
  "/organizer/register": "Стать организатором",
  "/organizer/login": "Вход организатора",
  "/organizer": "Кабинет организатора",
  "/organizer/compliance": "Согласование",
  "/admin": "Админ-консоль",
  "/demo": "Демо-портал",
  "/channel": "Партнёрский кабинет",
  "/main": "Описание проекта",
  "/proto": "Прототип платформы",
};

export const NOT_FOUND_TITLE = "Страница не найдена";

export function getTitleForPath(pathname: string): string {
  return ROUTE_TITLES[pathname] ?? NOT_FOUND_TITLE;
}
