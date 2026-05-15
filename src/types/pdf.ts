export type MaskRect = {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NormalizedMaskRect = Omit<MaskRect, "pageIndex">;

export type MasksByPage = Record<number, NormalizedMaskRect[]>;
