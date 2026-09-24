-- CreateIndex
CREATE INDEX "shops_ownerId_idx" ON "shops"("ownerId");

-- CreateIndex
CREATE INDEX "terminal_requests_shopId_idx" ON "terminal_requests"("shopId");

-- CreateIndex
CREATE INDEX "terminals_shopId_idx" ON "terminals"("shopId");
