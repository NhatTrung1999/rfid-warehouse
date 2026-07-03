import { Injectable } from '@nestjs/common';
import { SecondaryPrismaService } from 'src/prisma/prisma-secondary.service';

export interface SelectCheckIn {
  label: string;
  value: string;
}

export interface DeliveryData {
  DeliverNO: string;
  From: string;
  To: string;
  DeliverPerson: string;
  Quant: number;
  Account: string;
  Date: string;
  Remark: string;
  Purpose: string;
}

export interface ScanData {
  Scan: string;
  EPC: string;
  PH: string;
  Note: string;
  Stage: string;
  SerialNo: number;
  NoticeNo: string;
  Carton: string;
  Article: string;
  FD: string;
  DevTp: string;
  Season: string;
  ShoeName: string;
  ShoesType: string;
  Size: string;
}

export interface CheckEpcData {
  DeliverNO: string;
  Qty: number;
  LocationTo: string;
}

export interface CartonNumberData {
  ShelfId: string;
  CartonNumberOnly: string;
  NoOnly: string;
  CartonNumber: string;
}

@Injectable()
export class CheckinService {
  constructor(private readonly secondaryPrisma: SecondaryPrismaService) {}

  async getCheckInShelf(locationId: string): Promise<SelectCheckIn[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      SelectCheckIn[]
    >`SELECT LocationDetailName  AS [label]
            ,LocationDetailId    AS [value]
      FROM   SampleShoeInOut_LocationDetail
      WHERE  LocationId = ${locationId.trim()} AND YN = 1
      GROUP BY
            LocationDetailId
            ,LocationDetailName
      ORDER BY
            LocationDetailId    ASC`;
    return rows;
  }

  async getCheckInCarton(shelfId: string): Promise<SelectCheckIn[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      SelectCheckIn[]
    >`SELECT LocationDetailName  AS [label]
            ,LocationDetailId    AS [value]
      FROM   SampleShoeInOut_LocationDetail
      WHERE  LocationId = ${shelfId.trim()}
      GROUP BY
            LocationDetailId
            ,LocationDetailName`;
    return rows;
  }

  async getCheckInDelivery(locationId: string): Promise<DeliveryData[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      DeliveryData[]
    >`SELECT m.DeliverNO
            ,u.LocationName      AS [From]
            ,v.LocationName      AS [To]
            ,CASE 
                  WHEN bd.USERNAME IS NOT NULL THEN bd.USERNAME+CHAR(13)+CHAR(10)+'('+m.DeliverPersonId+')'
                  ELSE m.DeliverPersonId
            END                 AS [DeliverPerson]
            ,COUNT(d.DeliverNO)     Quant
            ,m.AccountCheckOut   AS Account
            ,m.DateCheckOut      AS [Date]
            ,m.Remark
            ,m.Purpose
      FROM   SampleShoeInOut_Deliver m
            INNER JOIN SampleShoeInOut_DeliverDetail d
                  ON  d.DeliverNO = m.DeliverNO
            LEFT JOIN SampleShoeInOut_Binding b
                  ON  b.EPC = d.EPC
                      AND CAST(b.BindingDate AS DATETIME)<=CAST(m.DateCheckOut AS DATETIME)
            LEFT JOIN SampleShoeInOut_Location u
                  ON  m.LocationFrom = u.LocationId
            LEFT JOIN SampleShoeInOut_Location v
                  ON  m.LocationTo = v.LocationId
            LEFT JOIN Busers bd
                  ON  bd.USERID = m.DeliverPersonId
      WHERE  m.YN = '1'
            AND d.YN = '1'
            AND b.ReleaseDate IS NULL
            AND b.YN = 1
            AND (
                    m.Enough=0
                    OR (m.AccountCheckIn IS NULL OR m.DateCheckIn IS NULL)
                )
            AND NOT EXISTS (
                    SELECT 1
                    FROM   SampleShoeInOut_DeliverDetailCheckEnough c
                    WHERE  c.DeliverNo = d.DeliverNo
                            AND c.EPC = d.EPC
                )
            AND m.LocationTo = ${locationId.trim()}
      GROUP BY
            m.DeliverNO
            ,u.LocationName
            ,m.AccountCheckOut
            ,m.DateCheckOut
            ,bd.USERNAME
            ,m.DeliverPersonId
            ,v.LocationName
            ,m.Remark
            ,m.Purpose
      ORDER BY
            m.DeliverNO            DESC`;
    return rows;
  }

  async getCheckInScan(deliveryNo: string): Promise<ScanData[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      ScanData[]
    >`SELECT ''                              AS Scan
      ,b.EPC
      ,LTRIM(RTRIM(ISNULL(b.PH ,'')))  AS PH
      ,b.Note
      ,b.stage AS Stage
      ,b.SerialNo
      ,b.NoticeNo
      ,CAST(b.SerialNoShip AS VARCHAR(10))
      +'/'+
       CAST(t.TotalPerNotice AS VARCHAR(10)) AS Carton
      ,b.Article
      ,b.FD
      ,b.DevType                       AS DevTp
      ,b.Season
      ,b.ShoeName
      ,CASE 
            WHEN b.ShoesType=1 THEN N'Finish Shoes'
            WHEN b.ShoesType=0 THEN N'Upper'
            ELSE N''
       END                             AS ShoesType
      ,b.Size
FROM   SampleShoeInOut_Binding b
       JOIN (
                SELECT NoticeNo
                      ,COUNT(*) AS TotalPerNotice
                FROM   SampleShoeInOut_Binding
                GROUP BY
                       NoticeNo
            ) t
            ON  t.NoticeNo = b.NoticeNo
       LEFT JOIN SampleShoeInOut_DeliverDetail d
            ON  d.EPC = b.EPC
       LEFT JOIN SampleShoeInOut_Deliver m
            ON  m.DeliverNO = ${deliveryNo.trim()}
WHERE  d.DeliverNO = ${deliveryNo.trim()}
       AND CAST(b.BindingDate AS DATETIME)<=CAST(m.DateCheckOut AS DATETIME)
       AND b.ReleaseDate IS NULL
       AND d.YN = 1
       AND b.YN = 1
       AND NOT EXISTS (
               SELECT 1
               FROM   SampleShoeInOut_DeliverDetailCheckEnough c
               WHERE  c.DeliverNo = d.DeliverNO
                      AND c.EPC = d.EPC
           );`;
    return rows;
  }

  async getCartonNumber(epc: string): Promise<CartonNumberData | null> {
    const epcValue = epc.trim();
    const rows = await this.secondaryPrisma.$queryRaw<
      CartonNumberData[]
    >`SELECT CASE 
                  WHEN ISNULL(b.ShelfId ,'')<>'' THEN b.ShelfId
                  WHEN ISNULL(b.ShelfIdDF ,'')<>'' THEN b.ShelfIdDF
                  ELSE b.ShelfIdBFDF
             END  AS ShelfId
            ,CASE 
                  WHEN m.LocationDetailId IS NOT NULL AND ISNULL(ldm.LocationDetailName ,'')<>'' THEN LTRIM(RTRIM(m.LocationDetailId))
                  WHEN ISNULL(b.ShelfId ,'')<>'' THEN LTRIM(RTRIM(ISNULL(NULLIF(b.CartonNumber ,'') ,b.ShelfId)))
                  WHEN ISNULL(b.ShelfIdDF ,'')<>'' THEN LTRIM(RTRIM(ISNULL(NULLIF(b.CartonNumberDF ,'') ,b.ShelfIdDF)))
                  ELSE LTRIM(
                           RTRIM(ISNULL(NULLIF(b.CartonNumberBFDF ,'') ,b.ShelfIdBFDF))
                       )
             END  AS CartonNumberOnly
            ,CASE 
                  WHEN m.LocationDetailId IS NOT NULL AND ISNULL(ldm.LocationDetailName ,'')<>'' THEN LTRIM(RTRIM(ISNULL(CAST(m.[No] AS VARCHAR(10)) ,'')))
                  WHEN ISNULL(b.ShelfId ,'')<>'' THEN LTRIM(RTRIM(ISNULL(CAST(b.[No] AS VARCHAR(10)) ,'')))
                  WHEN ISNULL(b.ShelfIdDF ,'')<>'' THEN LTRIM(RTRIM(ISNULL(CAST(b.NoDF AS VARCHAR(10)) ,'')))
                  ELSE LTRIM(RTRIM(ISNULL(CAST(b.NoBFDF AS VARCHAR(10)) ,'')))
             END  AS NoOnly
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
             END  AS CartonNumber
      FROM   SampleShoeInOut_Binding b WITH (NOLOCK)
             OUTER APPLY (
                SELECT TOP 1 m2.LocationDetailId
                      ,m2.[No]
                FROM   SampleShoeInOut_DeliverDetail d WITH (NOLOCK)
                       INNER JOIN SampleShoeInOut_Deliver m2 WITH (NOLOCK)
                            ON d.DeliverNo = m2.DeliverNo
                WHERE  d.YN = 1
                       AND d.EPC = ${epcValue}
                       AND d.EPC IS NOT NULL
                       AND ISNULL(m2.LocationDetailId ,'')<>''
                ORDER BY
                       m2.DateCheckOut DESC
                      ,m2.DeliverNO DESC
             ) m
             LEFT JOIN SampleShoeInOut_LocationDetail ldm WITH (NOLOCK)
                  ON ldm.LocationDetailId = m.LocationDetailId
                     AND m.LocationDetailId IS NOT NULL
      WHERE  b.EPC = ${epcValue}
             AND b.ReleaseDate IS NULL`;
    return rows[0] ?? null;
  }

  async checkEpc(epc: string): Promise<CheckEpcData | null> {
    const rows = await this.secondaryPrisma.$queryRaw<
      CheckEpcData[]
    >`SELECT TOP 1
             m.DeliverNO AS DeliverNO,
             m.Qty,
             m.LocationTo
      FROM   SampleShoeInOut_Deliver m
             LEFT JOIN SampleShoeInOut_DeliverDetail d
                  ON d.DeliverNO = m.DeliverNO
      WHERE  m.YN = '1'
             AND d.YN = '1'
             AND d.EPC = ${epc.trim()}
             AND (
                    m.Enough = 0
                    OR (
                         m.Enough IS NULL
                         AND (m.AccountCheckIn IS NULL OR m.DateCheckIn IS NULL)
                       )
                 )
             AND NOT EXISTS (
                    SELECT 1
                    FROM   SampleShoeInOut_DeliverDetailCheckEnough c
                    WHERE  c.DeliverNo = d.DeliverNo
                           AND c.EPC = d.EPC
                 )
      ORDER BY m.DeliverNO DESC`;
    return rows[0] ?? null;
  }
}
