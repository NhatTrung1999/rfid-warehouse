import { Injectable } from '@nestjs/common';
import { SecondaryPrismaService } from 'src/prisma/prisma-secondary.service';

export interface Warehouse {
  label: string;
  value: string;
}

@Injectable()
export class WarehouseService {
  constructor(private readonly secondaryPrisma: SecondaryPrismaService) {}

  async getWarehouses(): Promise<Warehouse[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      Warehouse[]
    >`SELECT l.LocationName  AS [label]
            ,f.LocationFrom  AS [value]
      FROM   SampleShoeInOut_LocationFlow f
            LEFT JOIN SampleShoeInOut_Location l
                  ON  l.LocationId = f.LocationFrom
      WHERE  f.LocationFrom IN ('LO240710-003'
                              ,'LO240710-004'
                              ,'LO240710-005'
                              ,'LO240710-006'
                              ,'LO260130-001')
      GROUP BY
            f.LocationFrom
            ,LocationName`;
    return rows;
  }
}
