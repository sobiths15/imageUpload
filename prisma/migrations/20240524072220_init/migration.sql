-- CreateTable
CREATE TABLE "image" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "encoding" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "image_pkey" PRIMARY KEY ("id")
);
