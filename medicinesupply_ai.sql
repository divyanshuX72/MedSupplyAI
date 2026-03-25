-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 26, 2026 at 10:53 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `medicinesupply_ai`
--

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(100) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `customer_name`, `total_amount`, `user_id`, `created_at`) VALUES
(1, 'Emergency Dept', 283.00, 1, '2026-01-02 09:20:33'),
(2, 'External Clinic A', 445.00, 1, '2026-01-06 09:20:33'),
(3, 'General Ward', 269.00, 1, '2026-01-01 09:20:33'),
(4, 'External Clinic A', 422.00, 1, '2026-01-15 09:20:33'),
(5, 'External Clinic A', 499.00, 1, '2026-01-08 09:20:33'),
(6, 'Pediatrics', 280.00, 1, '2025-12-28 09:20:33'),
(7, 'ICU', 217.00, 1, '2025-12-29 09:20:33'),
(8, 'ICU', 245.00, 1, '2026-01-08 09:20:33'),
(9, 'General Ward', 52.00, 1, '2026-01-13 09:20:33'),
(10, 'Emergency Dept', 324.00, 1, '2026-01-04 09:20:33'),
(11, 'General Ward', 500.00, 1, '2026-01-23 09:20:33'),
(12, 'External Clinic A', 426.00, 1, '2025-12-27 09:20:33'),
(13, 'General Ward', 138.00, 1, '2026-01-19 09:20:33'),
(14, 'ICU', 109.00, 1, '2026-01-07 09:20:33'),
(15, 'Emergency Dept', 350.00, 1, '2026-01-20 09:20:33'),
(16, 'External Clinic A', 194.00, 1, '2026-01-25 09:20:33'),
(17, 'General Ward', 354.00, 1, '2026-01-12 09:20:33'),
(18, 'Emergency Dept', 474.00, 1, '2026-01-16 09:20:33'),
(19, 'External Clinic A', 451.00, 1, '2026-01-10 09:20:33'),
(20, 'ICU', 483.00, 1, '2026-01-13 09:20:33'),
(21, 'External Clinic A', 429.00, 1, '2025-12-29 09:20:33'),
(22, 'General Ward', 390.00, 1, '2026-01-01 09:20:33'),
(23, 'General Ward', 465.00, 1, '2026-01-22 09:20:33'),
(24, 'Pediatrics', 417.00, 1, '2026-01-21 09:20:33'),
(25, 'Emergency Dept', 150.00, 1, '2026-01-24 09:20:33'),
(26, 'ICU', 432.00, 1, '2026-01-13 09:20:33'),
(27, 'Emergency Dept', 59.00, 1, '2026-01-10 09:20:33'),
(28, 'ICU', 273.00, 1, '2026-01-02 09:20:33'),
(29, 'Pediatrics', 109.00, 1, '2026-01-10 09:20:33'),
(30, 'General Ward', 423.00, 1, '2026-01-19 09:20:33'),
(31, 'Pediatrics', 234.00, 1, '2026-01-14 09:20:33'),
(32, 'ICU', 264.00, 1, '2025-12-29 09:20:33'),
(33, 'Emergency Dept', 360.00, 1, '2026-01-11 09:20:33'),
(34, 'ICU', 202.00, 1, '2026-01-07 09:20:33'),
(35, 'Pediatrics', 450.00, 1, '2026-01-07 09:20:33'),
(36, 'Pediatrics', 219.00, 1, '2025-12-28 09:20:33'),
(37, 'Pediatrics', 314.00, 1, '2026-01-02 09:20:33'),
(38, 'General Ward', 136.00, 1, '2026-01-25 09:20:33'),
(39, 'ICU', 386.00, 1, '2025-12-31 09:20:33'),
(40, 'General Ward', 462.00, 1, '2026-01-19 09:20:33'),
(41, 'General Ward', 435.00, 1, '2025-12-27 09:20:33'),
(42, 'External Clinic A', 366.00, 1, '2026-01-13 09:20:33'),
(43, 'General Ward', 346.00, 1, '2025-12-28 09:20:33'),
(44, 'Emergency Dept', 480.00, 1, '2026-01-22 09:20:33'),
(45, 'Pediatrics', 197.00, 1, '2026-01-13 09:20:33'),
(46, 'External Clinic A', 457.00, 1, '2026-01-15 09:20:33'),
(47, 'Pediatrics', 98.00, 1, '2026-01-18 09:20:33'),
(48, 'Emergency Dept', 290.00, 1, '2026-01-01 09:20:33'),
(49, 'Emergency Dept', 482.00, 1, '2026-01-25 09:20:33'),
(50, 'Emergency Dept', 486.00, 1, '2026-01-25 09:20:33');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `medicine_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `price_at_sale` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `medicine_id`, `quantity`, `price_at_sale`) VALUES
(1, 1, 10, 14, 39.00),
(2, 2, 7, 7, 36.00),
(3, 2, 6, 17, 48.00),
(4, 3, 8, 10, 25.00),
(5, 4, 6, 12, 17.00),
(6, 4, 6, 17, 35.00),
(7, 5, 5, 19, 39.00),
(8, 5, 1, 5, 24.00),
(9, 6, 3, 14, 22.00),
(10, 7, 7, 9, 38.00),
(11, 7, 3, 20, 50.00),
(12, 7, 3, 13, 25.00),
(13, 8, 4, 14, 34.00),
(14, 9, 4, 11, 16.00),
(15, 9, 6, 5, 39.00),
(16, 10, 9, 20, 32.00),
(17, 11, 8, 5, 30.00),
(18, 11, 8, 17, 12.00),
(19, 11, 1, 9, 35.00),
(20, 12, 3, 9, 16.00),
(21, 12, 9, 7, 29.00),
(22, 13, 2, 1, 34.00),
(23, 14, 1, 7, 8.00),
(24, 14, 3, 5, 47.00),
(25, 15, 5, 8, 10.00),
(26, 16, 10, 13, 38.00),
(27, 17, 9, 3, 11.00),
(28, 18, 4, 8, 12.00),
(29, 18, 7, 11, 22.00),
(30, 19, 6, 17, 6.00),
(31, 19, 3, 3, 41.00),
(32, 20, 6, 3, 15.00),
(33, 21, 7, 11, 42.00),
(34, 21, 5, 4, 13.00),
(35, 22, 2, 3, 14.00),
(36, 22, 2, 1, 6.00),
(37, 23, 9, 2, 33.00),
(38, 23, 9, 9, 20.00),
(39, 24, 10, 16, 19.00),
(40, 24, 5, 16, 32.00),
(41, 25, 1, 3, 21.00),
(42, 25, 3, 4, 40.00),
(43, 26, 1, 5, 46.00),
(44, 27, 3, 18, 49.00),
(45, 28, 9, 18, 50.00),
(46, 29, 10, 5, 22.00),
(47, 29, 3, 15, 33.00),
(48, 30, 2, 1, 18.00),
(49, 31, 2, 4, 12.00),
(50, 32, 7, 12, 14.00),
(51, 32, 5, 10, 41.00),
(52, 33, 4, 19, 41.00),
(53, 34, 10, 5, 27.00),
(54, 34, 4, 6, 21.00),
(55, 35, 8, 2, 50.00),
(56, 36, 3, 20, 21.00),
(57, 36, 3, 18, 35.00),
(58, 37, 10, 7, 21.00),
(59, 38, 6, 2, 9.00),
(60, 38, 5, 6, 19.00),
(61, 38, 9, 12, 16.00),
(62, 39, 7, 15, 30.00),
(63, 40, 3, 20, 45.00),
(64, 41, 9, 5, 13.00),
(65, 41, 3, 5, 36.00),
(66, 42, 2, 4, 36.00),
(67, 42, 7, 13, 49.00),
(68, 43, 2, 3, 18.00),
(69, 43, 8, 1, 45.00),
(70, 44, 8, 19, 8.00),
(71, 44, 8, 4, 23.00),
(72, 45, 4, 13, 47.00),
(73, 46, 4, 1, 38.00),
(74, 46, 6, 8, 7.00),
(75, 47, 3, 6, 31.00),
(76, 48, 1, 18, 13.00),
(77, 48, 1, 9, 36.00),
(78, 49, 6, 5, 26.00),
(79, 50, 8, 10, 30.00),
(80, 50, 8, 11, 50.00);

-- --------------------------------------------------------

--
-- Table structure for table `login_logs`
--

CREATE TABLE `login_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `login_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_logs`
--

INSERT INTO `login_logs` (`id`, `user_id`, `login_time`, `ip_address`) VALUES
(1, 1, '2026-01-26 09:22:33', '::1'),
(2, 1, '2026-01-26 09:23:35', '::1'),
(3, 1, '2026-01-26 09:27:52', '::1');

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `id` int(11) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `barcode` varchar(50) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`id`, `batch_number`, `name`, `category`, `stock`, `price`, `location`, `expiry_date`, `manufacturer`, `barcode`, `user_id`, `created_at`) VALUES
(1, 'B-992', 'Paracetamol IV', 'General', 120, 5.50, 'Rack A-12', '2025-12-31', 'PharmaCorp', NULL, NULL, '2026-01-26 09:17:45'),
(2, 'B-101', 'O- Blood Units', 'Critical', 4, 45.00, 'Cold Storage 2', '2025-03-15', 'BloodBank', NULL, NULL, '2026-01-26 09:17:45'),
(3, 'B-334', 'Ceftriaxone 1g', 'Antibiotic', 450, 12.30, 'Rack C-05', '2026-06-20', 'MedLife', NULL, NULL, '2026-01-26 09:17:45'),
(4, 'B-402', 'Insulin Glargine', 'Diabetes', 32, 35.75, 'Fridge 1', '2025-02-14', 'NovoNordisk', NULL, NULL, '2026-01-26 09:17:45'),
(5, 'B-115', 'Amoxicillin 500mg', 'Antibiotic', 280, 2.10, 'Rack B-05', '2026-08-15', 'GlaxoSmithKline', NULL, NULL, '2026-01-26 09:17:45'),
(6, 'B-203', 'Metformin 500mg', 'Diabetes', 150, 1.50, 'Rack A-08', '2026-10-20', 'Cipla', NULL, NULL, '2026-01-26 09:17:45'),
(7, 'B-305', 'Aspirin 100mg', 'Cardiac', 500, 0.80, 'Rack C-12', '2027-01-15', 'Bayer', NULL, NULL, '2026-01-26 09:17:45'),
(8, 'B-410', 'Ciprofloxacin 500mg', 'Antibiotic', 89, 8.75, 'Rack B-08', '2025-09-30', 'MedLife', NULL, NULL, '2026-01-26 09:17:45'),
(9, 'B-502', 'Adrenaline 1:1000', 'Critical', 25, 15.00, 'Secure Cabinet 1', '2025-05-10', 'Hospira', NULL, NULL, '2026-01-26 09:17:45'),
(10, 'B-603', 'Morphine 10mg', 'Surgery', 18, 12.50, 'Secure Cabinet 1', '2025-04-22', 'Abbott', NULL, NULL, '2026-01-26 09:17:45'),
(11, '235', 'adara', 'General', 34235, 234.00, 'Rack A-12', '2026-02-03', '342', NULL, NULL, '2026-01-26 09:18:04');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` varchar(50) NOT NULL,
  `medicine_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `medicine_id`, `quantity`, `estimated_cost`, `status`, `created_at`, `user_id`) VALUES
('ALN-2-1769420331063', 2, 20, 900.00, 'Approved', '2026-01-26 09:38:53', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` text NOT NULL,
  `role` varchar(20) DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`) VALUES
(1, 'Dr. Demo Admin', 'admin@hospital.com', '$2b$10$Kv5MvLqeO5qP80ZVWkAzUe8sKTb6VKEFRY8WyUQj9MnkI8y43leV6', 'admin', '2026-01-26 09:20:33');

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `user_id` int(11) NOT NULL,
  `hospital_name` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`user_id`, `hospital_name`, `phone`, `city`) VALUES
(1, 'City General Hospital', NULL, 'New York');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_id` (`invoice_id`),
  ADD KEY `medicine_id` (`medicine_id`);

--
-- Indexes for table `login_logs`
--
ALTER TABLE `login_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `batch_number` (`batch_number`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `medicine_id` (`medicine_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `login_logs`
--
ALTER TABLE `login_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  ADD CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`);

--
-- Constraints for table `login_logs`
--
ALTER TABLE `login_logs`
  ADD CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`);

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
