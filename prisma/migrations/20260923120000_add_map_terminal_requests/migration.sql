-- AlterTable
ALTER TABLE "TerminalRequest" RENAME TO "terminal_requests";

-- RenameIndex
ALTER INDEX "TerminalRequest_pkey" RENAME TO "terminal_requests_pkey";

-- RenameForeignKey
ALTER TABLE "terminal_requests" RENAME CONSTRAINT "TerminalRequest_shopId_fkey" TO "terminal_requests_shopId_fkey";