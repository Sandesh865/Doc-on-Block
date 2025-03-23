// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateVerification {
    struct Certificate {
        string hash;        // The PDF’s unique fingerprint
        string studentName; // Name of the student
        string degreeType;  // Type of degree (e.g., "BSc", "MSc")
        address issuer;     // Who uploaded it (university)
        uint256 timestamp;  // When it was uploaded
    }

    mapping(string => Certificate) public certificates;
    address public university;

    event CertificateIssued(string hash, address issuer, uint256 timestamp, string studentName, string degreeType);

    modifier onlyUniversity() {
        require(msg.sender == university, "Only the university can perform this action");
        _;
    }

    constructor() {
        university = msg.sender;
    }

    function issueCertificate(string memory _hash, string memory _studentName, string memory _degreeType) public onlyUniversity {
        certificates[_hash] = Certificate(_hash, _studentName, _degreeType, msg.sender, block.timestamp);
        emit CertificateIssued(_hash, msg.sender, block.timestamp, _studentName, _degreeType);
    }

    function verifyCertificate(string memory _hash) public view returns (address issuer, uint256 timestamp, string memory studentName, string memory degreeType) {
        Certificate memory cert = certificates[_hash];
        return (cert.issuer, cert.timestamp, cert.studentName, cert.degreeType);
    }
}