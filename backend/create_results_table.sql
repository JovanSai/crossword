-- Create crosswordpuzzleresults table in team26 database
-- Run this SQL script manually in your MySQL client

USE team26;

CREATE TABLE IF NOT EXISTS crosswordpuzzleresults (
    resultID INT AUTO_INCREMENT PRIMARY KEY,
    teamName VARCHAR(100) NOT NULL,
    puzzleID VARCHAR(20) NOT NULL,
    score FLOAT NOT NULL,
    correctWords INT NOT NULL,
    totalWords INT NOT NULL,
    timeRemaining FLOAT NOT NULL,
    submittedGrid TEXT,
    sessionID VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
