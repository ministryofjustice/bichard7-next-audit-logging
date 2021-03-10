import dateFormat from "dateformat"

const getFileName = (date: Date, uniqueName: string): string => {
  const folderName = dateFormat(date, "yyyy/mm/dd/hh/MM")
  return `${folderName}/${uniqueName}.xml`
}

export default getFileName
