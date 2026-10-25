export const OVERTIME_SECONDS = 30;
export const completionStars = (collected:number,overtime=false) => Math.max(0,collected-(overtime?1:0));
