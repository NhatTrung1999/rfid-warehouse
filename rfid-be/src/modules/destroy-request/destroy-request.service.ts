import { Injectable } from '@nestjs/common';
import { SecondaryPrismaService } from 'src/prisma/prisma-secondary.service';
import { Prisma } from 'src/generated/prisma/client';

export interface DestroyRequestRow {
  Destroy: boolean | null;
  EPCDestroy: string | null;
  Season: string | null;
  ModelName: string | null;
  Article: string | null;
  Stage: string | null;
  Size: string | null;
  Category: string | null;
  NoticeNo: string | null;
  FD: string | null;
  DevType: string | null;
  LR: string | null;
  KeepEPC: string | null;
  Reason: string | null;
  ShoesType: string | null;
  Shelf: string | null;
  CartonNumber: string | null;
  No: number | null;
  CheckExport: boolean | null;
  ConfirmDestroyDate: string | null;
  ConfirmDestroyUser: string | null;
  CanCheck: boolean | null;
  WarehouseEntryDate: string | null;
  DayInWarehouse: number | null;
  SortDate: string | null;
  HasQueue: number | null;
  RealStatus: string | null;
  TotalCount: number | null;
}

export interface DestroyRequestData {
  EPC: string | null;
  Article: string | null;
  Model: string | null;
  Category: string | null;
  Stage: string | null;
  Size: string | null;
  Season: string | null;
  NoticeNo: string | null;
  FD: string | null;
  DeviceType: string | null;
  ShoesType: string | null;
  ConfirmDate: string | null;
  ConfirmUser: string | null;
  Status: string | null;
  Destroy: boolean | null;
  Reason: string | null;
}

export interface DestroyRequestDataWarehouses {
  data: DestroyRequestData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class DestroyRequestService {
  constructor(private readonly secondaryPrisma: SecondaryPrismaService) {}

  async getDestroyRequestModelName(): Promise<{ ModelName: string }[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      { ModelName: string }[]
    >`SELECT XieMing AS ModelName
                    FROM   kfxxzl
                    WHERE  ISNULL(XieMing ,'')<>''
                    GROUP BY
                        XieMing`;
    return rows;
  }

  async getDestroyRequestStage(): Promise<{ Stage: string }[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      { Stage: string }[]
    >`SELECT KFJD AS Stage
      FROM   YPZL
      WHERE  ISNULL(KFJD ,'')<>''
      GROUP BY
          KFJD`;
    return rows;
  }

  async getDestroyRequestSeason(): Promise<{ Season: string }[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      { Season: string }[]
    >`SELECT JiJie AS Season
      FROM   kfxxzl
      WHERE  ISNULL(jijie ,'')<>''
      GROUP BY
          JiJie`;
    return rows;
  }

  async getDestroyRequestCategory(): Promise<{ Category: string }[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      { Category: string }[]
    >`SELECT Category
      FROM   kfxxzl
      WHERE  ISNULL(Category ,'')<>''
          AND Category NOT IN ('CORE'
                              ,'HCM(CORE)'
                              ,'HZO(KIDS)'
                              ,'HZO(ORI-STA)'
                              ,'HZO(RUN)'
                              ,'HZO(VULC)'
                              ,'HZO(VULC-SMU)'
                              ,'HZO(YA)'
                              ,'HZO(YA-SMU)'
                              ,'LIFESTYLE'
                              ,'Sports'
                              ,'YA')
      GROUP BY
          Category`;
    return rows;
  }

  async getDestroyRequestArticle(): Promise<{ Article: string }[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      { Article: string }[]
    >`SELECT DISTINCT     Article
      FROM   dbo.kfxxzl
      WHERE  Article IS NOT NULL
          AND Article<>''
          AND (
                  (JiJie LIKE 'FW%' AND JiJie>'FW24')
                  OR (JiJie LIKE 'SS%' AND JiJie>'SS24')
              )
      ORDER BY
          Article   ASC`;
    return rows;
  }

  async getDestroyRequestFD(): Promise<{ FD: string }[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      { FD: string }[]
    >`SELECT [VNName] AS FD
      FROM   [SampleShoeInOut_FD]`;
    return rows;
  }

  async getDestroyRequestNoticeNo(): Promise<{ NoticeNo: string }[]> {
    const rows = await this.secondaryPrisma.$queryRaw<
      { NoticeNo: string }[]
    >`SELECT [TestNo] AS NoticeNo
      FROM   [dbo].[ShoeTest]
      WHERE  (
              (Season LIKE 'FW%' AND Season>'FW24')
              OR (Season LIKE 'SS%' AND Season>'SS24')
          )
      ORDER BY
          InfomDate DESC`;
    return rows;
  }

  async getDestroyRequestLocation(): Promise<
    { label: string; value: string }[]
  > {
    const rows = await this.secondaryPrisma.$queryRaw<
      { label: string; value: string }[]
    >`SELECT LocationName  AS label
          ,LocationId    AS [value]
      FROM   SampleShoeInOut_Location
      WHERE  YN = 1
          AND (CheckTab=1 OR CheckTab=2)`;
    return rows;
  }

  async getDestroyRequestDataWarehouses(
    modelName: string[],
    stage: string[],
    season: string[],
    category: string[],
    article: string[],
    fd: string[],
    location: string[],
    status: string[],
    noticeNo: string[],
    page = 1,
    pageSize = 50,
  ): Promise<DestroyRequestDataWarehouses> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safePageSize = Math.min(200, Math.max(1, Math.floor(pageSize) || 50));
    const offset = (safePage - 1) * safePageSize;
    const modelFilter = modelName.length
      ? Prisma.sql`AND b.ShoeName COLLATE DATABASE_DEFAULT IN (${Prisma.join(modelName)})`
      : Prisma.empty;

    const stageFilter = stage.length
      ? Prisma.sql`AND b.Stage COLLATE DATABASE_DEFAULT IN (${Prisma.join(stage)})`
      : Prisma.empty;

    const seasonFilter = season.length
      ? Prisma.sql`AND b.Season COLLATE DATABASE_DEFAULT IN (${Prisma.join(season)})`
      : Prisma.empty;

    const articleFilter = article.length
      ? Prisma.sql`AND b.Article COLLATE DATABASE_DEFAULT IN (${Prisma.join(article)})`
      : Prisma.empty;

    const noticeNoFilter = noticeNo.length
      ? Prisma.sql`AND b.NoticeNo COLLATE DATABASE_DEFAULT IN (${Prisma.join(noticeNo)})`
      : Prisma.empty;

    const fdFilter = fd.length
      ? Prisma.sql`AND (${Prisma.join(
          fd.map(
            (f) =>
              Prisma.sql`(${f} LIKE '%' + b.FD + '%' OR b.FD LIKE ${'%' + f + '%'})`,
          ),
          ' OR ',
        )})`
      : Prisma.empty;

    const categoryFilter = category.length
      ? Prisma.sql`AND k.Category COLLATE DATABASE_DEFAULT IN (${Prisma.join(category)})`
      : Prisma.empty;

    const statusFilter = status.length
      ? Prisma.sql`AND RealStatus IN (${Prisma.join(status)})`
      : Prisma.empty;

    const rows = await this.secondaryPrisma.$queryRaw<
      DestroyRequestRow[]
    >`SET NOCOUNT ON;
                  SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

                  DECLARE @locAll BIT=1;      
                  DECLARE @warehouseId VARCHAR(32)=NULL;   
                  DECLARE @EPC VARCHAR(50)=NULL;   

                  IF OBJECT_ID('tempdb..#LocAll') IS NOT NULL
                      DROP TABLE #LocAll;
                  IF OBJECT_ID('tempdb..#ExcludeDeliver') IS NOT NULL
                      DROP TABLE #ExcludeDeliver;
                  IF OBJECT_ID('tempdb..#Base') IS NOT NULL
                      DROP TABLE #Base;
                  IF OBJECT_ID('tempdb..#B1') IS NOT NULL
                      DROP TABLE #B1;
                  IF OBJECT_ID('tempdb..#LatestDate') IS NOT NULL
                      DROP TABLE #LatestDate;
                  IF OBJECT_ID('tempdb..#EarliestCheckIn')IS NOT NULL
                      DROP TABLE #EarliestCheckIn;
                  IF OBJECT_ID('tempdb..#LatestDeliver') IS NOT NULL
                      DROP TABLE #LatestDeliver;
                  IF OBJECT_ID('tempdb..#FinalResult') IS NOT NULL
                      DROP TABLE #FinalResult;

                  CREATE TABLE #LocAll
                  (
                    LocationId VARCHAR(32) COLLATE DATABASE_DEFAULT PRIMARY KEY
                  );
                  INSERT INTO #LocAll
                    (
                      LocationId
                    )
                  VALUES
                    (
                      'LO240710-003'
                    ),('LO240710-004'),('LO240710-005'),('LO240710-006'),('LO260130-001');

                  CREATE TABLE #ExcludeDeliver
                  (
                    DeliverNo VARCHAR(32) COLLATE DATABASE_DEFAULT PRIMARY KEY
                  );
                  INSERT INTO #ExcludeDeliver
                    (
                      DeliverNo
                    )
                  VALUES
                    (
                      '2024080001'
                    ),('202506000015002');


                  SELECT b.EPC
                        ,b.NoticeNo
                        ,b.Article
                        ,b.FD
                        ,b.DevType
                        ,b.Stage
                        ,b.Season
                        ,b.ShoeName  AS ModelName
                        ,b.Size
                        ,b.ShoesType
                        ,b.LendDate  AS DateCheckOut
                        ,b.ShelfId
                        ,b.CartonNumber
                        ,b.LocationId
                        ,b.Reason
                        ,b.LR
                  INTO   #Base
                  FROM   SampleShoeInOut_Binding b WITH (NOLOCK)
                  WHERE  b.YN = 1
                        AND b.ReleaseDate IS NULL
                        AND (
                                (
                                    @locAll=1
                                    AND b.LocationId COLLATE DATABASE_DEFAULT IN (SELECT LocationId
                                                                                  FROM   #LocAll)
                                )
                                OR (
                                        @locAll=0
                                        AND (
                                                @warehouseId IS NULL
                                                OR b.LocationId COLLATE DATABASE_DEFAULT=@warehouseId
                                            )
                                    )
                            )
                        AND (@EPC IS NULL OR b.EPC LIKE @EPC)
                        ${modelFilter}
                        ${fdFilter}
                        ${articleFilter}
                        ${noticeNoFilter}
                        ${stageFilter}
                        ${seasonFilter}
                        AND EXISTS (
                                SELECT 1
                                FROM   SampleShoeInOut_DeliverDetail dd WITH (NOLOCK)
                                WHERE  dd.EPC = b.EPC
                                        AND dd.YN = 1
                                        AND dd.DeliverNO NOT IN (SELECT DeliverNo
                                                                FROM   #ExcludeDeliver)
                            );

                  SELECT *
                  INTO   #B1
                  FROM   (
                            SELECT *
                                  ,ROW_NUMBER() OVER(PARTITION BY EPC ORDER BY DateCheckOut DESC) AS rn
                            FROM   #Base
                        ) x
                  WHERE  rn = 1;

                  SELECT dd.EPC COLLATE DATABASE_DEFAULT  AS EPC
                        ,MAX(m.DateCheckOut)              AS MaxDate
                  INTO   #LatestDate
                  FROM   SampleShoeInOut_DeliverDetail dd WITH (NOLOCK)
                        JOIN SampleShoeInOut_Deliver m WITH (NOLOCK)
                              ON  m.DeliverNo COLLATE DATABASE_DEFAULT = dd.DeliverNo COLLATE DATABASE_DEFAULT
                        JOIN #B1 b1
                              ON  b1.EPC COLLATE DATABASE_DEFAULT = dd.EPC COLLATE DATABASE_DEFAULT
                  WHERE  dd.YN = 1
                        AND dd.DeliverNO NOT IN (SELECT DeliverNo
                                                  FROM   #ExcludeDeliver)
                  GROUP BY
                        dd.EPC COLLATE DATABASE_DEFAULT;

                  SELECT dd.EPC COLLATE DATABASE_DEFAULT AS EPC
                        ,COALESCE(MIN(dd.DateCheckIn) ,MIN(m.DateCheckIn)) AS WarehouseEntryDate
                  INTO   #EarliestCheckIn
                  FROM   SampleShoeInOut_DeliverDetail dd WITH (NOLOCK)
                        JOIN SampleShoeInOut_Deliver m WITH (NOLOCK)
                              ON  m.DeliverNo COLLATE DATABASE_DEFAULT = dd.DeliverNo COLLATE DATABASE_DEFAULT
                        JOIN #B1 b1
                              ON  b1.EPC COLLATE DATABASE_DEFAULT = dd.EPC COLLATE DATABASE_DEFAULT
                  WHERE  dd.YN = 1
                        AND dd.DeliverNO NOT IN (SELECT DeliverNo
                                                  FROM   #ExcludeDeliver)
                  GROUP BY
                        dd.EPC COLLATE DATABASE_DEFAULT;

                  SELECT dd.EPC COLLATE DATABASE_DEFAULT AS EPC
                        ,dd.DeliverNo
                        ,m.LocationDetailId
                        ,m.No
                        ,m.DateCheckOut
                  INTO   #LatestDeliver
                  FROM   SampleShoeInOut_DeliverDetail dd WITH (NOLOCK)
                        JOIN SampleShoeInOut_Deliver m WITH (NOLOCK)
                              ON  m.DeliverNo COLLATE DATABASE_DEFAULT = dd.DeliverNo COLLATE DATABASE_DEFAULT
                        JOIN #LatestDate d
                              ON  d.EPC COLLATE DATABASE_DEFAULT = dd.EPC COLLATE DATABASE_DEFAULT
                                  AND d.MaxDate = m.DateCheckOut
                  WHERE  dd.YN = 1
                        AND dd.DeliverNO NOT IN (SELECT DeliverNo
                                                  FROM   #ExcludeDeliver)
                        AND (dd.DateCheckIn IS NOT NULL OR m.DateCheckIn IS NOT NULL)
                        AND NOT (ISNULL(m.Enough ,0)=1 AND dd.AccountCheckIn IS NULL);

                  SELECT CAST(ISNULL(dq.Destroy ,0) AS BIT) AS Destroy
                        ,b1.EPC                      AS EPCDestroy
                        ,b1.Season
                        ,b1.ModelName
                        ,b1.Article
                        ,b1.Stage
                        ,b1.Size
                        ,k.Category
                        ,b1.NoticeNo
                        ,b1.FD
                        ,b1.DevType
                        ,b1.LR                       AS LR
                        ,kc.EPC                      AS KeepEPC
                        ,b1.Reason                   AS Reason
                        ,CASE 
                              WHEN b1.ShoesType=0 THEN 'Upper'
                              ELSE 'Finish Shoes'
                        END                         AS ShoesType
                        ,CASE 
                              WHEN CHARINDEX(' - ' ,nm2.ShelfFull)>0 THEN LTRIM(
                                      SUBSTRING(
                                          nm2.ShelfFull
                                          ,CHARINDEX(' - ' ,nm2.ShelfFull)+3
                                          ,LEN(nm2.ShelfFull)
                                      )
                                  )
                              ELSE nm2.ShelfFull
                        END                         AS Shelf
                        ,CASE 
                              WHEN ISNULL(nm2.CartonFull ,'')='' THEN ''
                              WHEN ISNULL(nm2.ShelfFull ,'')='' OR nm2.CartonFull=nm2.ShelfFull THEN ''
                              ELSE LTRIM(
                                      REPLACE(REPLACE(nm2.CartonFull ,nm2.ShelfFull ,'') ,' - ' ,'')
                                  )
                        END                         AS CartonNumber
                        ,CASE 
                              WHEN d.No IS NULL OR d.No=0 THEN NULL
                              ELSE d.No
                        END                         AS No
                        ,CAST(NULL AS BIT)           AS CheckExport
                        ,CAST(NULL AS DATETIME)      AS [ConfirmDestroyDate]
                        ,CAST(NULL AS NVARCHAR(50))  AS [ConfirmDestroyUser]
                        ,CAST(1 AS BIT)              AS CanCheck
                        ,ec.WarehouseEntryDate
                        ,DATEDIFF(DAY ,ec.WarehouseEntryDate ,GETDATE()) AS DayInWarehouse
                        ,b1.DateCheckOut              AS SortDate
                        ,HasQueue = CASE 
                                        WHEN EXISTS (
                                                  SELECT 1
                                                  FROM   SampleShoeInOut_DisposalQueue d2 WITH (NOLOCK)
                                                  WHERE  d2.EPC = b1.EPC
                                                        AND d2.YN = 1
                                              ) THEN 1
                                        ELSE 0
                                    END
                        ,RealStatus = CASE 
                                          WHEN dq.BPMStatus='S' AND dq.YN=1 THEN N'Destroy InProcess'
                                          WHEN ISNULL(dq.Destroy ,0)=1 AND dq.AccountCheckIn IS NOT NULL AND dq.YN=1 THEN N'WH confirm'
                                          WHEN ISNULL(dq.CheckExport ,0)=1 AND dq.YN=1 THEN N'Data Export'
                                          WHEN ISNULL(dq.Destroy ,0)=1 AND dq.CreatedTime IS NOT NULL AND dq.YN=1 THEN N'FD confirm'
                                          WHEN dq.BPMStatus='F' AND dq.YN=1 THEN N'Destroy Adopt'
                                          WHEN kc.EPC IS NOT NULL AND kc.YN=0 THEN N'Pending Destroy'
                                          WHEN kc.EPC IS NULL OR ISNULL(kc.YN ,0)=0 THEN N'Sys pending destroy'
                                          WHEN kc.EPC IS NOT NULL AND kc.YN=1 THEN N'Keep'
                                          ELSE N'Pending Destroy'
                                      END
                  INTO   #FinalResult
                  FROM   #B1 b1
                        LEFT JOIN #EarliestCheckIn ec
                              ON  ec.EPC COLLATE DATABASE_DEFAULT = b1.EPC COLLATE DATABASE_DEFAULT
                        JOIN #LatestDeliver d
                              ON  d.EPC COLLATE DATABASE_DEFAULT = b1.EPC COLLATE DATABASE_DEFAULT
                        LEFT JOIN kfxxzl k
                              ON  k.ARTICLE COLLATE DATABASE_DEFAULT = b1.Article COLLATE DATABASE_DEFAULT
                        LEFT JOIN SampleShoeInOut_LocationDetail ld
                              ON  ld.LocationDetailId COLLATE DATABASE_DEFAULT = b1.ShelfId COLLATE DATABASE_DEFAULT
                        LEFT JOIN SampleShoeInOut_LocationDetail lds
                              ON  lds.LocationDetailId COLLATE DATABASE_DEFAULT = b1.CartonNumber COLLATE DATABASE_DEFAULT
                        CROSS APPLY (
                      SELECT CartonId = COALESCE(
                                NULLIF(LTRIM(RTRIM(b1.CartonNumber)) ,N'')
                                ,d.LocationDetailId
                            )
                  ) src
                  CROSS APPLY (
                      SELECT CartonFullRaw = CASE 
                                                  WHEN src.CartonId LIKE 'LODE%-%' THEN REPLACE(SUBSTRING(src.CartonId ,5 ,LEN(src.CartonId)) ,'-' ,' - ')
                                                  ELSE NULL
                                            END
                            ,ShelfIdRaw = CASE 
                                              WHEN src.CartonId LIKE 'LODE%-%-%' THEN LEFT(
                                                        src.CartonId
                                                      ,LEN(src.CartonId)- CHARINDEX('-' ,REVERSE(src.CartonId))
                                                    )
                                              ELSE NULL
                                          END
                  ) df
                  CROSS APPLY (
                      SELECT CartonFull = COALESCE(df.CartonFullRaw ,lds.LocationDetailName)
                            ,ShelfFull = COALESCE(
                                CASE 
                                      WHEN df.ShelfIdRaw LIKE 'LODE%-%' THEN REPLACE(
                                              SUBSTRING(df.ShelfIdRaw ,5 ,LEN(df.ShelfIdRaw))
                                              ,'-'
                                              ,' - '
                                          )
                                      ELSE NULL
                                END
                                ,ld.LocationDetailName
                                ,df.CartonFullRaw
                            )
                  ) nm2
                  LEFT JOIN SampleShoeInOut_DisposalQueue dq
                              ON  dq.EPC COLLATE DATABASE_DEFAULT = b1.EPC COLLATE DATABASE_DEFAULT
                                  AND dq.YN = 1
                        LEFT JOIN SampleShoeInOut_KeepConfig kc
                              ON  kc.EPC COLLATE DATABASE_DEFAULT = b1.EPC COLLATE DATABASE_DEFAULT
                  WHERE  1 = 1
                        ${categoryFilter}
                        AND (
                                EXISTS (
                                    SELECT 1
                                    FROM   SampleShoeInOut_DisposalQueue d2 WITH (NOLOCK)
                                    WHERE  d2.EPC = b1.EPC
                                            AND d2.YN = 1
                                            AND d2.EPC IS NOT NULL
                                )
                                OR kc.EPC IS NOT NULL
                            );

                  SELECT *
                        ,COUNT(*) OVER() AS TotalCount
                  FROM   #FinalResult
                  WHERE  1 = 1
                        ${statusFilter}
                  ORDER BY
                        Category
                        ,SortDate DESC
                  OFFSET ${offset} ROWS FETCH NEXT ${safePageSize} ROWS ONLY;`;
    const total = rows.length > 0 ? Number(rows[0].TotalCount) : 0;
    const data: DestroyRequestData[] = rows.map(({ TotalCount, ...rest }) => ({
      EPC: rest.EPCDestroy,
      Article: rest.Article,
      Model: rest.ModelName,
      Category: rest.Category,
      Stage: rest.Stage,
      Size: rest.Size,
      Season: rest.Season,
      NoticeNo: rest.NoticeNo,
      FD: rest.FD,
      DeviceType: rest.DevType,
      ShoesType: rest.ShoesType,
      ConfirmDate: rest.ConfirmDestroyDate,
      ConfirmUser: rest.ConfirmDestroyUser,
      Status: rest.RealStatus,
      Destroy: rest.Destroy,
      Reason: rest.Reason,
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
