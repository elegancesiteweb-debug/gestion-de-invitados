-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "clipApiKey" TEXT,
ADD COLUMN     "mercadoPagoAccessToken" TEXT,
ADD COLUMN     "resendApiKey" TEXT,
ADD COLUMN     "resendFromEmail" TEXT,
ADD COLUMN     "stripeSecretKey" TEXT;

