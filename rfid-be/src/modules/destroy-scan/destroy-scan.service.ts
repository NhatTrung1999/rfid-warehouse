import { Injectable } from '@nestjs/common';
import { SecondaryPrismaService } from 'src/prisma/prisma-secondary.service';
import { Prisma } from 'src/generated/prisma/client';
import { FilterDestroyScanDto } from './dto/filter-destroy-scan.dto';

export interface DestroyScanRow {
  ScannedCount: number;
  NotScannedCount: number;
  Total: number;
}

export interface DestroyScanDataRow {
  STT: string;
  EPC: string;
  BPMNO: string;
  TestNo: string;
  Article: string;
  Carton: string;
  FD: string;
  DevTp: string;
  stage: string;
  Season: string;
  ShoeName: string;
  ShoesType: string;
  Size: string;
  Note: string;
  SerialNo: number;
  CartonNumber: string;
  CheckTime: string;
  DateCheckIn: string;
  AccountCheckIn: string;
  Remark: string;
  TotalCount: number | null;
}

export interface DestroyScanData {
  BatchNo: string;
  STT: string;
  DateScan: string;
  EPC: string;
  ShoesType: string;
  Note: string;
  NoticeNo: string;
  SerialNo: number;
  UserScan: string;
  Article: string;
  FD: string;
  DevTp: string;
  Stage: string;
  Season: string;
  ShoeName: string;
  Size: string;
  CartonNumber: string;
  ExportTime: string;
  Remark: string;
  Carton: string;
}

export interface DestroyScanDataWarehouses {
  data: DestroyScanData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class DestroyScanService {
  constructor(private readonly secondaryPrisma: SecondaryPrismaService) {}

  async getDestroyScanOverview(locationId: string): Promise<DestroyScanRow[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      DestroyScanRow[]
    >`DECLARE @location VARCHAR(32)=${locationId.trim()};
      WITH bb AS (
              SELECT bin.EPC
                    ,bin.LocationId
                    ,bin.CheckInIsNull
                    ,ROW_NUMBER() OVER(
                          PARTITION BY bin.EPC
                        ,bin.CheckInIsNull ORDER BY bin.BindingDate DESC
                      ) AS rn
              FROM   (
                          SELECT b2.EPC
                                ,b2.LocationId
                                ,b2.BindingDate
                                ,CASE 
                                      WHEN q2.AccountCheckIn IS NULL THEN 1
                                      ELSE 0
                                END AS CheckInIsNull
                          FROM   SampleShoeInOut_Binding b2 WITH (NOLOCK)
                                JOIN SampleShoeInOut_DisposalQueue q2 WITH (NOLOCK)
                                      ON  q2.EPC = b2.EPC
                          WHERE  b2.YN = 1
                                AND q2.Destroy = 1
                                AND q2.CheckExport = 1
                                AND q2.YN = 1
                                AND q2.BPMStatus IS NULL
                                AND (
                                        (q2.AccountCheckIn IS NULL AND b2.ReleaseDate IS NULL)
                                        OR (
                                                q2.AccountCheckIn IS NOT NULL
                                                AND b2.BindingDate<=ISNULL(q2.DateCheckIn ,GETDATE())
                                            )
                                    )
                      ) bin
          )

      SELECT SUM(
                CASE 
                      WHEN q.Destroy=1
                AND q.AccountCheckIn IS NOT NULL
                AND q.BPMStatus IS NULL
                AND q.YN=1
                AND q.CheckExport=1 THEN 1 ELSE 0 END
            )  AS ScannedCount
            ,SUM(
                CASE 
                      WHEN q.Destroy=1
                AND q.AccountCheckIn IS NULL
                AND q.BPMStatus IS NULL
                AND q.YN=1
                AND q.CheckExport=1 THEN 1 ELSE 0 END
            )  AS NotScannedCount
            ,SUM(
                CASE 
                      WHEN q.Destroy=1
                AND q.YN=1
                AND q.BPMStatus IS NULL
                AND q.CheckExport=1 THEN 1 ELSE 0 END
            )  AS Total
      FROM   SampleShoeInOut_DisposalQueue q WITH (NOLOCK)
            JOIN bb b
                  ON  b.EPC = q.EPC
                      AND b.rn = 1
                      AND b.CheckInIsNull = CASE 
                                                WHEN q.AccountCheckIn IS NULL THEN 1
                                                ELSE 0
                                            END
      WHERE  b.LocationId = @location
            AND q.Destroy = 1
            AND q.CheckExport = 1
            AND q.YN = 1
            AND q.BPMStatus IS NULL`;
    return rows;
  }

  async getDestroyScanChip(checkInDestroy: string, locationScan: string) {
    const noticeNo = checkInDestroy.split('-')[0];
    const serialNo = checkInDestroy.split('-')[1];
    let bpm = '';

    if (locationScan === 'LO240710-003') {
      bpm = '2F2000000001';
    } else if (locationScan === 'LO240710-004') {
      bpm = '3F2000000001';
    }
    const rows = await this.secondaryPrisma.$queryRaw`SELECT TOP 1 
                                                            MAX(q.BPMNO) AS DeliverNO
                                                            ,q.EPC
                                                      FROM   SampleShoeInOut_DisposalQueue q
                                                            LEFT JOIN SampleShoeInOut_Binding b
                                                                  ON  b.EPC = q.EPC
                                                      WHERE  b.YN = '1'
                                                            AND b.NoticeNo = ${noticeNo.trim()}
                                                            AND b.SerialNo = ${serialNo.trim()}
                                                            AND q.Destroy = 1
                                                            AND q.CheckExport = 1
                                                            AND q.BPMNO = ${bpm?.trim()}
                                                      GROUP BY
                                                            q.EPC;`;
    return rows;
  }

  async getDestroyScanData(
    filters: FilterDestroyScanDto = {},
  ): Promise<DestroyScanDataWarehouses> {
    const safePage = Math.max(1, Math.floor(filters.page ?? 1) || 1);
    const safePageSize = Math.min(
      200,
      Math.max(1, Math.floor(filters.pageSize ?? 50) || 50),
    );
    const offset = (safePage - 1) * safePageSize;
    const locationId = filters.locationId?.trim();
    const locationFilter = locationId
      ? Prisma.sql`AND b.LocationId COLLATE DATABASE_DEFAULT = ${locationId}`
      : Prisma.empty;

    const rows: DestroyScanDataRow[] = await this.secondaryPrisma.$queryRaw<
      DestroyScanDataRow[]
    >`
      WITH bb AS (
            SELECT bin.EPC
                  ,bin.LocationId
                  ,bin.NoticeNo
                  ,bin.Article
                  ,bin.FD
                  ,bin.DevType
                  ,bin.stage
                  ,bin.Season
                  ,bin.ShoeName
                  ,bin.ShoesType
                  ,bin.Size
                  ,bin.Note
                  ,bin.SerialNo
                  ,bin.CartonNumber
                  ,bin.ShelfId
                  ,bin.[No]
                  ,bin.CheckInIsNull
                  ,ROW_NUMBER() OVER(
                        PARTITION BY bin.EPC
                        ,bin.CheckInIsNull ORDER BY bin.BindingDate DESC
                  ) AS rn
            FROM   (
                        SELECT b2.EPC
                              ,b2.LocationId
                              ,b2.NoticeNo
                              ,b2.Article
                              ,b2.FD
                              ,b2.DevType
                              ,b2.stage
                              ,b2.Season
                              ,b2.ShoeName
                              ,b2.ShoesType
                              ,b2.Size
                              ,b2.Note
                              ,b2.SerialNo
                              ,b2.CartonNumber
                              ,b2.ShelfId
                              ,b2.[No]
                              ,b2.BindingDate
                              ,CASE 
                                    WHEN q2.AccountCheckIn IS NULL THEN 1
                                    ELSE 0
                              END AS CheckInIsNull
                        FROM   SampleShoeInOut_Binding b2 WITH (NOLOCK)
                              JOIN SampleShoeInOut_DisposalQueue q2 WITH (NOLOCK)
                                    ON  q2.EPC = b2.EPC
                        WHERE  b2.YN = 1
                              AND q2.BPMStatus IS NULL
                              AND q2.YN = 1
                              AND q2.Destroy = 1
                              AND q2.CheckExport = 1
                              AND (
                                    (q2.AccountCheckIn IS NULL AND b2.ReleaseDate IS NULL)
                                    OR (
                                                q2.AccountCheckIn IS NOT NULL
                                                AND b2.BindingDate<=ISNULL(q2.DateCheckIn ,GETDATE())
                                          )
                                    )
                  ) bin
      ),
      rmk AS (
            SELECT rdd.EPC
                  ,MAX(CASE WHEN dl.LocationTo='LO240710-008' THEN 1 ELSE 0 END) AS HasLab
                  ,MAX(CASE WHEN dl.LocationTo='LO240710-009' THEN 1 ELSE 0 END) AS HasOcpt
            FROM   SampleShoeInOut_DeliverDetail rdd WITH (NOLOCK)
                  JOIN SampleShoeInOut_Deliver dl WITH (NOLOCK)
                        ON  dl.DeliverNO = rdd.DeliverNO
            WHERE  rdd.YN = 1
                  AND dl.LocationTo IN ('LO240710-008' ,'LO240710-009')
            GROUP BY
                  rdd.EPC
      )

      SELECT q.STT
            ,b.EPC
            ,q.BPMNO
            ,b.NoticeNo  AS TestNo
            ,b.Article
            ,q.Carton	
            ,b.FD
            ,b.DevType   AS DevTp
            ,b.stage
            ,b.Season
            ,b.ShoeName
            ,b.ShoesType
            ,b.Size
            ,b.Note
            ,b.SerialNo
            ,
            CASE 
                  WHEN ISNULL(b.CartonNumber ,'')<>'' THEN REPLACE(RIGHT(b.CartonNumber ,LEN(b.CartonNumber)- 4) ,'-' ,' - ')
                  +CASE 
                        WHEN ISNULL(b.[No] ,0)=0 THEN ''
                        ELSE ' - '+CAST(b.[No] AS VARCHAR)
                  END
                  WHEN ISNULL(b.ShelfId ,'')<>'' THEN REPLACE(RIGHT(b.ShelfId ,LEN(b.ShelfId)- 4) ,'-' ,' - ')
                  +CASE 
                        WHEN ISNULL(b.[No] ,0)=0 THEN ''
                        ELSE ' - '+CAST(b.[No] AS VARCHAR)
                  END
                  ELSE ''
            END         AS CartonNumber
            ,q.CheckTime
            ,q.DateCheckIn
            ,q.AccountCheckIn
            ,ISNULL(
            CASE 
                  WHEN rmk.HasLab=1
            AND rmk.HasOcpt=1 THEN N'Lab, OCPT'
                  WHEN rmk.HasLab=1 THEN N'Lab'
                  WHEN rmk.HasOcpt=1 THEN N'OCPT'
                  ELSE N'' END
            ,N''
            )           AS Remark
            ,COUNT(*) OVER() AS TotalCount
      FROM   SampleShoeInOut_DisposalQueue q WITH (NOLOCK)
            JOIN bb b
                  ON  b.EPC = q.EPC
                  AND b.rn = 1
                  AND b.CheckInIsNull = CASE 
                                                WHEN q.AccountCheckIn IS NULL THEN 1
                                                ELSE 0
                                          END
            LEFT JOIN rmk
                  ON  rmk.EPC = q.EPC
      WHERE  q.BPMStatus IS NULL
            AND q.YN = 1
            AND q.Destroy = 1
            AND q.CheckExport = 1
            ${locationFilter}
      ORDER BY
            b.Article,
            q.CheckTime DESC,
            b.EPC,
            q.BPMNO,
            b.SerialNo
      OFFSET ${offset} ROWS FETCH NEXT ${safePageSize} ROWS ONLY`;

    const total = rows.length > 0 ? Number(rows[0].TotalCount) : 0;
    const data: DestroyScanData[] = rows.map((row, index) => ({
      BatchNo: row.BPMNO,
      STT: '',
      DateScan: '',
      EPC: row.EPC,
      ShoesType: row.ShoesType,
      Note: row.Note,
      NoticeNo: row.TestNo,
      SerialNo: row.SerialNo,
      UserScan: row.AccountCheckIn,
      Article: row.Article,
      FD: row.FD,
      DevTp: row.DevTp,
      Stage: row.stage,
      Season: row.Season,
      ShoeName: row.ShoeName,
      Size: row.Size,
      CartonNumber: row.CartonNumber,
      ExportTime: row.CheckTime,
      Remark: row.Remark,
      Carton: row.Carton,
    }));
    return {
      data,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.ceil(total / safePageSize),
    };
  }
}
