export type DistributeFlatArray<A>
  = A extends [infer H, ...infer T]
      ? H extends H
          ? [H, ...DistributeFlatArray<T>]
          : never
      : []
