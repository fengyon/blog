const origin = []

const menus = []

const originSet = new Set(origin)

const menusMap = new Map(menus.map((item, index) => [item, index + 1]))

const originArr = []

originSet.forEach((element) => {
  if (!menusMap.has(element.text)) return
  originArr[menusMap.get(element.text)] = element
  menusMap.delete(element.text)
  originSet.delete(element)
})

originSet.forEach((element) => {
  const [key, value] =
    [...menusMap.entries()].find(([key]) => element.text.includes(key)) ||
    [...menusMap.entries()].find(([key]) => key.includes(element.text)) ||
    []
  if (!value) return
  originArr[value] = element
  menusMap.delete(key)
  originSet.delete(element)
})

originSet.forEach((element) => {
  const codeSet = new Set(element.text.split(''))
  const [key, value] =
    [...menusMap.entries()].sort(
      ([key1], [key2]) =>
        key2.split('').filter((c) => codeSet.has(c)).length -
        key1.split('').filter((c) => codeSet.has(c)).length
    )[0] || []
  if (!value) return
  originArr[value] = element
  menusMap.delete(key)
  originSet.delete(element)
})

originArr.push(...originSet)

console.log(originArr.filter(Boolean))
console.log(originSet.size)
