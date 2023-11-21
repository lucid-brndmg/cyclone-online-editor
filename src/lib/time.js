// source: https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time by fearofawhackplanet
export function timeDifference(current, previous) {

  let msPerMinute = 60 * 1000;
  let msPerHour = msPerMinute * 60;
  let msPerDay = msPerHour * 24;
  // let msPerMonth = msPerDay * 30;
  // let msPerYear = msPerDay * 365;

  let elapsed = current - previous;

  if (elapsed < msPerMinute) {
    return Math.round(elapsed/1000) + ' seconds ago';
  }

  else if (elapsed < msPerHour) {
    return Math.round(elapsed/msPerMinute) + ' minutes ago';
  }

  else if (elapsed < msPerDay ) {
    return Math.round(elapsed/msPerHour ) + ' hours ago';
  }

  return new Date(previous).toLocaleString()

  // else if (elapsed < msPerMonth) {
  //   return Math.round(elapsed/msPerDay) + ' days ago';
  // }
  //
  // else if (elapsed < msPerYear) {
  //   return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';
  // }
  //
  // else {
  //   return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';
  // }
}