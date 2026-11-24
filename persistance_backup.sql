-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: persistance
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `conclusoes`
--

DROP TABLE IF EXISTS `conclusoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conclusoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `habito_id` int NOT NULL,
  `data` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_habito_data` (`habito_id`,`data`),
  KEY `idx_conclusoes_data` (`data`),
  CONSTRAINT `fk_conclusoes_habito` FOREIGN KEY (`habito_id`) REFERENCES `habitos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=164 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conclusoes`
--

LOCK TABLES `conclusoes` WRITE;
/*!40000 ALTER TABLE `conclusoes` DISABLE KEYS */;
INSERT INTO `conclusoes` VALUES (29,7,'2026-10-18'),(28,8,'2026-10-18'),(41,9,'2026-11-01'),(43,10,'2026-09-28'),(47,10,'2026-09-29'),(49,10,'2026-09-30'),(53,10,'2026-10-01'),(56,10,'2026-10-02'),(60,10,'2026-10-03'),(63,10,'2026-10-04'),(66,10,'2026-10-05'),(71,10,'2026-10-07'),(76,10,'2026-10-09'),(81,10,'2026-10-10'),(84,10,'2026-10-11'),(86,10,'2026-10-12'),(90,10,'2026-10-13'),(92,10,'2026-10-14'),(96,10,'2026-10-15'),(99,10,'2026-10-16'),(104,10,'2026-10-17'),(107,10,'2026-10-18'),(110,10,'2026-10-19'),(115,10,'2026-10-20'),(119,10,'2026-10-21'),(124,10,'2026-10-22'),(128,10,'2026-10-23'),(133,10,'2026-10-24'),(136,10,'2026-10-25'),(138,10,'2026-10-26'),(143,10,'2026-10-27'),(147,10,'2026-10-28'),(152,10,'2026-10-29'),(156,10,'2026-10-30'),(161,10,'2026-10-31'),(44,11,'2026-09-28'),(50,11,'2026-09-30'),(54,11,'2026-10-01'),(57,11,'2026-10-02'),(67,11,'2026-10-05'),(70,11,'2026-10-06'),(72,11,'2026-10-07'),(73,11,'2026-10-08'),(77,11,'2026-10-09'),(87,11,'2026-10-12'),(91,11,'2026-10-13'),(93,11,'2026-10-14'),(97,11,'2026-10-15'),(100,11,'2026-10-16'),(111,11,'2026-10-19'),(116,11,'2026-10-20'),(120,11,'2026-10-21'),(125,11,'2026-10-22'),(129,11,'2026-10-23'),(139,11,'2026-10-26'),(144,11,'2026-10-27'),(148,11,'2026-10-28'),(153,11,'2026-10-29'),(157,11,'2026-10-30'),(45,12,'2026-09-28'),(51,12,'2026-09-30'),(68,12,'2026-10-05'),(78,12,'2026-10-09'),(94,12,'2026-10-14'),(101,12,'2026-10-16'),(112,12,'2026-10-19'),(121,12,'2026-10-21'),(130,12,'2026-10-23'),(140,12,'2026-10-26'),(149,12,'2026-10-28'),(158,12,'2026-10-30'),(42,13,'2026-09-27'),(46,13,'2026-09-28'),(55,13,'2026-10-01'),(58,13,'2026-10-02'),(61,13,'2026-10-03'),(64,13,'2026-10-04'),(74,13,'2026-10-08'),(79,13,'2026-10-09'),(82,13,'2026-10-10'),(85,13,'2026-10-11'),(88,13,'2026-10-12'),(95,13,'2026-10-14'),(98,13,'2026-10-15'),(102,13,'2026-10-16'),(105,13,'2026-10-17'),(108,13,'2026-10-18'),(113,13,'2026-10-19'),(117,13,'2026-10-20'),(122,13,'2026-10-21'),(126,13,'2026-10-22'),(131,13,'2026-10-23'),(134,13,'2026-10-24'),(141,13,'2026-10-26'),(145,13,'2026-10-27'),(150,13,'2026-10-28'),(154,13,'2026-10-29'),(159,13,'2026-10-30'),(162,13,'2026-10-31'),(48,14,'2026-09-29'),(52,14,'2026-09-30'),(59,14,'2026-10-02'),(62,14,'2026-10-03'),(65,14,'2026-10-04'),(69,14,'2026-10-05'),(75,14,'2026-10-08'),(80,14,'2026-10-09'),(83,14,'2026-10-10'),(89,14,'2026-10-12'),(103,14,'2026-10-16'),(106,14,'2026-10-17'),(109,14,'2026-10-18'),(114,14,'2026-10-19'),(118,14,'2026-10-20'),(123,14,'2026-10-21'),(127,14,'2026-10-22'),(132,14,'2026-10-23'),(135,14,'2026-10-24'),(137,14,'2026-10-25'),(142,14,'2026-10-26'),(146,14,'2026-10-27'),(151,14,'2026-10-28'),(155,14,'2026-10-29'),(160,14,'2026-10-30'),(163,14,'2026-10-31');
/*!40000 ALTER TABLE `conclusoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `habitos`
--

DROP TABLE IF EXISTS `habitos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `habitos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `nome` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` enum('Saúde','Estudos','Desenvolvimento','Sono','Outro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Outro',
  `frequencia` enum('Todos os dias','Segunda a sexta','3x por semana','2x por semana') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Todos os dias',
  `data_inicio` date NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_habitos_usuario` (`usuario_id`),
  CONSTRAINT `fk_habitos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `habitos`
--

LOCK TABLES `habitos` WRITE;
/*!40000 ALTER TABLE `habitos` DISABLE KEYS */;
INSERT INTO `habitos` VALUES (7,1,'treinar','Saúde','Todos os dias','2026-10-18','2026-10-18 20:47:37'),(8,1,'estudar 3h','Saúde','Todos os dias','2026-10-18','2026-10-18 20:47:45'),(9,2,'jogar brawl stars','Outro','Todos os dias','2026-11-01','2026-11-01 19:38:11'),(10,3,'Beber 2L de água','Saúde','Todos os dias','2026-09-27','2026-11-01 19:42:36'),(11,3,'Estudar 1h','Estudos','Segunda a sexta','2026-09-27','2026-11-01 19:42:36'),(12,3,'Treinar','Saúde','3x por semana','2026-09-27','2026-11-01 19:42:36'),(13,3,'Ler 20 páginas','Desenvolvimento','Todos os dias','2026-09-27','2026-11-01 19:42:36'),(14,3,'Dormir antes das 23h','Sono','Todos os dias','2026-09-27','2026-11-01 19:42:36');
/*!40000 ALTER TABLE `habitos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha_hash` varchar(72) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Alef Robert','alefrobert1793xd@gmail.com','$2a$10$eUB5jcio78nqrTaf17ufcue0nussusX9hIHwJbDLYVSHO7UVM1yIe','2026-10-18 15:49:04'),(2,'vinicius','vinibiscoito46@gmail.com','$2a$10$wAgx7lnpe1jqQYubQEPStO2Dw3EoEf5rLwI8XV6FyK1wLrIyIeJ.2','2026-11-01 19:37:50'),(3,'Conta Demo','demo@persistance.com','$2a$10$bjLB6w9lxHHBKXG8IKY0pecqgJd91UKuY9n5.Nr6BJw3ztqmPQ2y6','2026-11-01 19:42:36');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-23 20:39:02
