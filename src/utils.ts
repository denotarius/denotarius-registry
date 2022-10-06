export const convertToJSON = (array: any) => {
  const first = array[0].join();
  const headers = first.split(',');

  const jsonData = [];
  for (let i = 1, { length } = array; i < length; i++) {
    const myRow = array[i].join();
    const row = myRow.split(',');

    const data: Record<any, any> = {};
    for (let x = 0; x < row.length; x++) {
      data[headers[x]] = row[x];
    }
    jsonData.push(data);
  }
  return jsonData;
};
