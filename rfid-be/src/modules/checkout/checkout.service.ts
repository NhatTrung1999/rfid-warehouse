import { Injectable } from '@nestjs/common';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateCheckoutDto } from './dto/update-checkout.dto';
import { SecondaryPrismaService } from 'src/prisma/prisma-secondary.service';

export interface DropdownCheckOut {
  label: string;
  value: string;
}

export interface EpcRawData {
  EPC: string;
  Category: string;
  NoticeNo: string;
  CartonNumber: string;
  PH: string;
  Article: string;
  FD: string;
  DevTp: string;
  Stage: string;
  Season: string;
  ShoeName: string;
  Size: string;
  ShoesType: string;
  SerialNoShip: string;
  LocationTo: string;
  LocationFromId: string;
  LocationName: string;
  ShelfId: string;
  CartonNumberOnly: string;
  NoOnly: string;
}

export interface EpcFormatData {
  EPC: string;
  Category: string;
  NoticeNo: string;
  CartonNumber: string;
  PH: string;
  Article: string;
  FD: string;
  DevTp: string;
  Stage: string;
  Season: string;
  ShoeName: string;
  Size: string;
  ShoesType: string;
}

@Injectable()
export class CheckoutService {
  constructor(private readonly secondaryPrisma: SecondaryPrismaService) {}

  async getCheckOutFrom(locationId: string): Promise<DropdownCheckOut[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      DropdownCheckOut[]
    >`SELECT l.LocationName AS [label]
            ,t.LocationTo   AS [value]
      FROM   (
                SELECT ${locationId.trim()} LocationTo
                UNION
                ALL  SELECT LocationTo
                      FROM   SampleShoeInOut_LocationFlow
                      WHERE  LocationFrom IN (${locationId.trim()})
                            AND LocationTo<>'LO240724-003'
                            AND AutoCheckIn = 1
                            AND isHide = 1
                            AND YN = 1
            ) t
            LEFT JOIN SampleShoeInOut_Location l
                  ON  l.LocationId = t.LocationTo
      WHERE  t.LocationTo<>'LO240724-003'
      GROUP BY
            LocationTo
            ,l.LocationName`;

    return rows;
  }

  async getCheckOutTo(locationFrom: string): Promise<DropdownCheckOut[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      DropdownCheckOut[]
    >`SELECT l.LocationName  AS [label]
            ,f.LocationTo    AS [value]
      FROM   SampleShoeInOut_LocationFlow f
            LEFT JOIN SampleShoeInOut_Location l
                  ON  l.LocationId = f.LocationTo
      WHERE  LocationFrom = ${locationFrom.trim()}
            AND f.YN = 1
            AND l.YN = 1`;
    console.log(`SELECT l.LocationName  AS [label]
            ,f.LocationTo    AS [value]
      FROM   SampleShoeInOut_LocationFlow f
            LEFT JOIN SampleShoeInOut_Location l
                  ON  l.LocationId = f.LocationTo
      WHERE  LocationFrom = ${locationFrom.trim()}
            AND f.YN = 1
            AND l.YN = 1`);
    return rows;
  }

  async getCheckOutShelf(locationId: string): Promise<DropdownCheckOut[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      DropdownCheckOut[]
    >`SELECT LocationDetailName  AS [label]
            ,LocationDetailId    AS [value]
      FROM   SampleShoeInOut_LocationDetail
      WHERE  LocationId = ${locationId.trim()}
            AND YN = 1
      ORDER BY
            SUBSTRING(LocationDetailId ,10 ,1)
            ,CASE 
                  WHEN SUBSTRING(LocationDetailId ,11 ,1) IN ('L' ,'R') THEN SUBSTRING(LocationDetailId ,11 ,1)
                  ELSE              ''
            END
            ,TRY_CAST(
                CASE 
                      WHEN SUBSTRING(LocationDetailId ,11 ,1) IN ('L' ,'R') THEN SUBSTRING(LocationDetailId ,12 ,LEN(LocationDetailId))
                      ELSE SUBSTRING(LocationDetailId ,11 ,LEN(LocationDetailId))
                END
                AS INT
            )`;
    return rows;
  }

  async getCheckOutCarton(shelfId: string): Promise<DropdownCheckOut[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      DropdownCheckOut[]
    >`SELECT LocationDetailName  AS [label]
            ,LocationDetailId    AS [value]
      FROM   SampleShoeInOut_LocationDetail
      WHERE  LocationId = ${shelfId.trim()}`;
    return rows;
  }

  async getCheckOutEPC(epc: string): Promise<EpcFormatData[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      EpcRawData[]
    >`SELECT TOP 1 
              b.EPC
              ,k.Category
              ,tt.TestNO                       AS NoticeNo
              ,CASE 
                    WHEN m.LocationDetailId IS NOT NULL AND ISNULL(ldm.LocationDetailName ,'')<>'' THEN LTRIM(RTRIM(ldm.LocationDetailName))
                        +CASE 
                              WHEN ISNULL(m.[No] ,0)=0 THEN ''
                              ELSE ' - '+CAST(m.[No] AS VARCHAR(10))
                        END
                    WHEN ISNULL(b.ShelfId ,'')<>'' THEN REPLACE(
                            CASE 
                                  WHEN LEN(ISNULL(NULLIF(b.CartonNumber ,'') ,b.ShelfId))>4
                            AND LEFT(ISNULL(NULLIF(b.CartonNumber ,'') ,b.ShelfId) ,4)='LODE'
                                THEN RIGHT(
                                    ISNULL(NULLIF(b.CartonNumber ,'') ,b.ShelfId)
                                    ,LEN(ISNULL(NULLIF(b.CartonNumber ,'') ,b.ShelfId))- 4
                                )
                                ELSE ISNULL(NULLIF(b.CartonNumber ,'') ,b.ShelfId) END
                            ,'-'
                            ,' - '
                        )
                        +CASE 
                              WHEN ISNULL(b.[No] ,0)=0 THEN ''
                              ELSE ' - '+CAST(b.[No] AS VARCHAR(10))
                        END
                    WHEN ISNULL(b.ShelfIdDF ,'')<>'' THEN REPLACE(
                            CASE 
                                  WHEN LEN(ISNULL(NULLIF(b.CartonNumberDF ,'') ,b.ShelfIdDF))>4
                            AND LEFT(ISNULL(NULLIF(b.CartonNumberDF ,'') ,b.ShelfIdDF) ,4)='LODE'
                                THEN RIGHT(
                                    ISNULL(NULLIF(b.CartonNumberDF ,'') ,b.ShelfIdDF)
                                    ,LEN(ISNULL(NULLIF(b.CartonNumberDF ,'') ,b.ShelfIdDF))- 4
                                )
                                ELSE ISNULL(NULLIF(b.CartonNumberDF ,'') ,b.ShelfIdDF) END
                            ,'-'
                            ,' - '
                        )
                        +CASE 
                              WHEN ISNULL(b.NoDF ,0)=0 THEN ''
                              ELSE ' - '+CAST(b.NoDF AS VARCHAR(10))
                        END
                    WHEN ISNULL(b.ShelfIdBFDF ,'')<>'' THEN REPLACE(
                            CASE 
                                  WHEN LEN(ISNULL(NULLIF(b.CartonNumberBFDF ,'') ,b.ShelfIdBFDF))>4
                            AND LEFT(ISNULL(NULLIF(b.CartonNumberBFDF ,'') ,b.ShelfIdBFDF) ,4)='LODE'
                                THEN RIGHT(
                                    ISNULL(NULLIF(b.CartonNumberBFDF ,'') ,b.ShelfIdBFDF)
                                    ,LEN(ISNULL(NULLIF(b.CartonNumberBFDF ,'') ,b.ShelfIdBFDF))- 4
                                )
                                ELSE ISNULL(NULLIF(b.CartonNumberBFDF ,'') ,b.ShelfIdBFDF) END
                            ,'-'
                            ,' - '
                        )
                        +CASE 
                              WHEN ISNULL(b.NoBFDF ,0)=0 THEN ''
                              ELSE ' - '+CAST(b.NoBFDF AS VARCHAR(10))
                        END
                    ELSE ''
              END                             AS CartonNumber
              ,LTRIM(RTRIM(ISNULL(b.PH ,'')))  AS PH
              ,tt.Article
              ,tt.FD
              ,tt.DevTp
              ,tt.Stage
              ,tt.Season
              ,tt.ShoeName
              ,b.Size
              ,CASE 
                    WHEN b.ShoesType=1 THEN N'Finish Shoes'
                    WHEN b.ShoesType=0 THEN N'Upper'
                    ELSE N''
              END                             AS ShoesType
              ,CAST(b.SerialNoShip AS VARCHAR(10))
              +'/'+
              CAST(t_ship.TotalPerNotice AS VARCHAR(10)) AS SerialNoShip
              ,mTo.LocationTo
              ,mTo.LocationFrom                AS LocationFromId
              ,l.LocationName
              ,CASE 
                    WHEN ISNULL(b.ShelfId ,'')<>'' THEN b.ShelfId
                    WHEN ISNULL(b.ShelfIdDF ,'')<>'' THEN b.ShelfIdDF
                    ELSE b.ShelfIdBFDF
              END                             AS ShelfId
              ,CASE 
                    WHEN m.LocationDetailId IS NOT NULL AND ISNULL(ldm.LocationDetailName ,'')<>'' THEN LTRIM(RTRIM(ldm.LocationDetailName))
                    WHEN ISNULL(b.ShelfId ,'')<>'' THEN LTRIM(RTRIM(ISNULL(NULLIF(b.CartonNumber ,'') ,b.ShelfId)))
                    WHEN ISNULL(b.ShelfIdDF ,'')<>'' THEN LTRIM(RTRIM(ISNULL(NULLIF(b.CartonNumberDF ,'') ,b.ShelfIdDF)))
                    ELSE LTRIM(
                            RTRIM(ISNULL(NULLIF(b.CartonNumberBFDF ,'') ,b.ShelfIdBFDF))
                        )
              END                             AS CartonNumberOnly
              ,CASE 
                    WHEN m.LocationDetailId IS NOT NULL AND ISNULL(ldm.LocationDetailName ,'')<>'' THEN LTRIM(RTRIM(ISNULL(CAST(m.[No] AS VARCHAR(10)) ,'')))
                    WHEN ISNULL(b.ShelfId ,'')<>'' THEN LTRIM(RTRIM(ISNULL(CAST(b.[No] AS VARCHAR(10)) ,'')))
                    WHEN ISNULL(b.ShelfIdDF ,'')<>'' THEN LTRIM(RTRIM(ISNULL(CAST(b.NoDF AS VARCHAR(10)) ,'')))
                    ELSE LTRIM(RTRIM(ISNULL(CAST(b.NoBFDF AS VARCHAR(10)) ,'')))
              END                             AS NoOnly
        FROM   SampleShoeInOut_Binding b WITH (NOLOCK)
              OUTER APPLY (
            SELECT COUNT(*) AS TotalPerNotice
            FROM   SampleShoeInOut_Binding b2 WITH (NOLOCK)
            WHERE  b2.NoticeNo = b.NoticeNo
                  AND b2.YN = 1
        ) t_ship
        OUTER APPLY (
            SELECT TOP 1 d.DeliverNo
            FROM   SampleShoeInOut_DeliverDetail d WITH (NOLOCK)
                  INNER JOIN SampleShoeInOut_Deliver m2 WITH (NOLOCK)
                        ON  d.DeliverNo = m2.DeliverNo
            WHERE  d.YN = 1
                  AND d.EPC = ${epc.trim()}
                  AND d.EPC IS NOT NULL
            ORDER BY
                  m2.DateCheckOut DESC
                  ,m2.DeliverNO DESC
        ) d_max
        OUTER APPLY (
            SELECT TOP 1 m3.LocationDetailId
                  ,m3.[No]
            FROM   SampleShoeInOut_DeliverDetail d WITH (NOLOCK)
                  INNER JOIN SampleShoeInOut_Deliver m3 WITH (NOLOCK)
                        ON  d.DeliverNo = m3.DeliverNo
            WHERE  d.YN = 1
                  AND d.EPC = ${epc.trim()}
                  AND d.EPC IS NOT NULL
                  AND ISNULL(m3.LocationDetailId ,'')<>''
            ORDER BY
                  m3.DateCheckOut     DESC
                  ,m3.DeliverNO        DESC
        ) m
        LEFT JOIN SampleShoeInOut_Deliver mTo WITH (NOLOCK)
                    ON  d_max.DeliverNo = mTo.DeliverNO
              LEFT JOIN SampleShoeInOut_Location l WITH (NOLOCK)
                    ON  l.LocationId = mTo.LocationTo
              LEFT JOIN SampleShoeInOut_LocationDetail ldm WITH (NOLOCK)
                    ON  ldm.LocationDetailId = m.LocationDetailId
                        AND m.LocationDetailId IS NOT NULL
              LEFT JOIN (
                        SELECT t.TestNO
                              ,t.Article
                              ,t.FD
                              ,t.DevTp
                              ,t.Stage
                              ,t.Season
                              ,t.XieMing  AS ShoeName
                              ,t.SIZ      AS SIZE
                        FROM   ShoeTest t WITH (NOLOCK)
                        UNION
                        SELECT y.YPDH     AS TestNO
                              ,y.Article
                              ,k.FD
                              ,y.KFJD     AS DevTp
                              ,y.KFJD     AS Stage
                              ,k.JiJie    AS Season
                              ,k.XieMing  AS ShoeName
                              ,y.ypcc     AS SIZE
                        FROM   ypzl y WITH (NOLOCK)
                              LEFT JOIN kfxxzl k WITH (NOLOCK)
                                    ON  k.XieXing = y.XieXing
                                        AND k.SheHao = y.SheHao
                        UNION
                        SELECT sod.PO            AS TestNO
                              ,sod.Article
                              ,k.FD
                              ,k.DevType         AS DevTp
                              ,sod.Stage
                              ,k.JiJie           AS Season
                              ,k.XieMing         AS ShoeName
                              ,y.ypcc            AS SIZE
                        FROM   SampleOrder_Data sod WITH (NOLOCK)
                              LEFT JOIN kfxxzl k WITH (NOLOCK)
                                    ON  k.Article = sod.Article
                              LEFT JOIN ypzl y WITH (NOLOCK)
                                    ON  k.XieXing = y.XieXing
                                        AND k.SheHao = y.SheHao
                                        AND sod.Stage = y.KFJD
                        WHERE  sod.Stage IS NOT     NULL
                    )                          AS tt
                    ON  tt.TestNO = b.NoticeNo
              LEFT JOIN kfxxzl k WITH (NOLOCK)
                    ON  k.ARTICLE = tt.Article
        WHERE  b.EPC = ${epc.trim()}
              AND b.ReleaseDate IS NULL
              AND mTo.DateCheckOut>=b.BindingDate
              AND d_max.DeliverNo IS NOT NULL
              AND NOT EXISTS (
                      SELECT 1
                      FROM   dbo.SampleShoeInOut_DisposalQueue qx WITH (NOLOCK)
                      WHERE  qx.EPC = b.EPC
                              AND qx.YN = 1
                              AND qx.Destroy = 1
                              AND qx.BPMStatus<>'X'
                  )
        ORDER BY
              b.BindingDate DESC;`;

    const formatRows: EpcFormatData[] = rows.map((row) => ({
      EPC: row.EPC,
      Category: row.Category,
      NoticeNo: row.NoticeNo,
      CartonNumber: row.CartonNumber,
      PH: row.PH,
      Article: row.Article,
      FD: row.FD,
      DevTp: row.DevTp,
      Stage: row.Stage,
      Season: row.Season,
      ShoeName: row.ShoeName,
      Size: row.Size,
      ShoesType: row.ShoesType,
    }));
    return formatRows;
  }
}
