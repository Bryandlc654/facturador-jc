-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tipo_de_documento` VARCHAR(191) NOT NULL DEFAULT '6',
    `numero_de_documento` VARCHAR(191) NOT NULL,
    `denominacion` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cliente_userId_numero_de_documento_key`(`userId`, `numero_de_documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `codigo_producto_sunat` VARCHAR(191) NULL DEFAULT '10000000',
    `descripcion` VARCHAR(191) NOT NULL,
    `unidad_de_medida` VARCHAR(191) NOT NULL DEFAULT 'NIU',
    `valor_unitario` DECIMAL(12, 2) NOT NULL,
    `precio_unitario` DECIMAL(12, 2) NOT NULL,
    `tipo_de_igv` INTEGER NOT NULL DEFAULT 1,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Factura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `clienteId` INTEGER NOT NULL,
    `operacion` VARCHAR(191) NOT NULL,
    `tipo_de_comprobante` INTEGER NOT NULL DEFAULT 1,
    `serie` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `sunat_transaction` INTEGER NOT NULL DEFAULT 1,
    `fecha_de_emision` DATETIME(3) NOT NULL,
    `fecha_de_vencimiento` DATETIME(3) NULL,
    `moneda` INTEGER NOT NULL DEFAULT 1,
    `tipo_de_cambio` DECIMAL(4, 3) NULL,
    `porcentaje_de_igv` DECIMAL(4, 2) NOT NULL DEFAULT 18.00,
    `descuento_global` DECIMAL(12, 2) NULL,
    `total_descuento` DECIMAL(12, 2) NULL,
    `total_gravada` DECIMAL(12, 2) NOT NULL,
    `total_inafecta` DECIMAL(12, 2) NULL,
    `total_exonerada` DECIMAL(12, 2) NULL,
    `total_igv` DECIMAL(12, 2) NOT NULL,
    `total_otros_cargos` DECIMAL(12, 2) NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `observaciones` VARCHAR(191) NULL,
    `condiciones_de_pago` VARCHAR(191) NULL,
    `medio_de_pago` VARCHAR(191) NULL,
    `formato_de_pdf` VARCHAR(191) NULL DEFAULT 'A4',
    `enlace` VARCHAR(191) NULL,
    `enlace_del_pdf` VARCHAR(191) NULL,
    `enlace_del_xml` VARCHAR(191) NULL,
    `enlace_del_cdr` VARCHAR(191) NULL,
    `aceptada_por_sunat` BOOLEAN NOT NULL DEFAULT false,
    `sunat_description` VARCHAR(191) NULL,
    `sunat_responsecode` VARCHAR(191) NULL,
    `codigo_hash` VARCHAR(191) NULL,
    `cadena_para_codigo_qr` VARCHAR(191) NULL,
    `anulado` BOOLEAN NOT NULL DEFAULT false,
    `motivo_anulacion` VARCHAR(191) NULL,
    `fecha_anulacion` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Factura_userId_tipo_de_comprobante_serie_numero_key`(`userId`, `tipo_de_comprobante`, `serie`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacturaItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `facturaId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `unidad_de_medida` VARCHAR(191) NOT NULL DEFAULT 'NIU',
    `codigo` VARCHAR(191) NOT NULL,
    `codigo_producto_sunat` VARCHAR(191) NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `cantidad` DECIMAL(12, 2) NOT NULL,
    `valor_unitario` DECIMAL(12, 2) NOT NULL,
    `precio_unitario` DECIMAL(12, 2) NOT NULL,
    `descuento` DECIMAL(12, 2) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `tipo_de_igv` INTEGER NOT NULL DEFAULT 1,
    `igv` DECIMAL(12, 2) NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacturaItem` ADD CONSTRAINT `FacturaItem_facturaId_fkey` FOREIGN KEY (`facturaId`) REFERENCES `Factura`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacturaItem` ADD CONSTRAINT `FacturaItem_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;