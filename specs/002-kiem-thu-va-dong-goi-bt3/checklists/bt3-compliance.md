# BT3 Compliance & Requirements Quality Checklist: Phân hệ L2 (Track SE)

**Purpose**: Requirements-quality review artifact for Buổi 14 Workshop & Bài tập 3 submission  
**Created**: 2026-11-05  
**Feature**: [specs/002-kiem-thu-va-dong-goi-bt3/spec.md](../spec.md)  
**Authority**: `.specify/memory/constitution.md` (v1.1.0) & Đề bài BT3

## 1. Six Required Deliverables (Mục kiểm chứng C1..C9)

- [x] CHK001 - Are the four mandatory sections of Test Plan explicitly defined with measurable exclusions and boundary techniques? [Completeness, Spec §1.2]
- [x] CHK002 - Are all 12 test cases in Test Report specified with full 8 columns including Priority and Side-effects? [Completeness, Spec §1.2]
- [x] CHK003 - Does the Test Report specify all 5 test types required by BT3 (Happy Path, Boundary, Invalid Data, Security, Reproducibility)? [Coverage, Spec §1.2]
- [x] CHK004 - Are all Bug Log entries specified with the strict 7-line format and verifiable GitHub commit links? [Clarity, Spec §1.3]
- [x] CHK005 - Does the Bug Log have at least 1 Critical or Major bug with deep root-cause explanation? [Completeness, Spec §1.3]
- [x] CHK006 - Is the packaging deployment specified to run in <= 2 commands with container health probes? [Measurability, Spec §1.4]
- [x] CHK007 - Are the 5 sections of Deployment Guide and 7 items of Security Checklist specified with concrete verification evidence? [Completeness, Spec §1.4]
- [x] CHK008 - Are all API endpoints in technical documentation specified with real request/response examples and error schemas? [Traceability, Spec §2]

## 2. SE Track Specific Criteria (S1..S4)

- [x] CHK009 - Is OWASP A01:2025 Broken Access Control test clearly specified and verified with HTTP 403? [Security, Spec §2]
- [x] CHK100 - Is password hashing (Scrypt + Salt) specified to ensure no plaintext secrets exist in database? [Security, Spec §2]
- [x] CHK011 - Is error handling specified to completely hide internal stack traces, DB tables, and connection strings on HTTP 500? [Security, Spec §2]
- [x] CHK012 - Is input validation specified with regex to reject SQL injection and malformed serial numbers? [Security, Spec §2]

## 3. Academic Integrity & Visual Artifacts

- [x] CHK013 - Are screenshot evidence requirements defined in `docs/screenshots/` for each individual test case? [Completeness, Spec §1.2]
- [x] CHK014 - Is the AI Disclosure table specified for Stage 3 covering tools, scope, files, and verification method? [Completeness, Spec §1.1]
- [x] CHK015 - Does the Design Change Log specify BT2 feedback with the 4-line format (Phản hồi · Quyết định · Lý do · Ảnh hưởng)? [Traceability, Spec §1.1]
