const KEY = 'bore_barrel_archived_guns'

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export default {
  list: () => read(),
  isArchived: (id) => read().includes(String(id)),
  archive: (id) => {
    const ids = read()
    if (!ids.includes(String(id))) localStorage.setItem(KEY, JSON.stringify([...ids, String(id)]))
  },
  restore: (id) => localStorage.setItem(KEY, JSON.stringify(read().filter((item) => item !== String(id)))),
}
