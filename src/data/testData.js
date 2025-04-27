const testData = {
    Dev: [
        { 
            name: "Red Premium 3000", 
            email: "TestUser1@test.test", 
            password: "N/A", 
            msisdn: "01111111111",
            FamilyName: "Test",
            ContractID: "5dd08e02-a9f1-4126-97ad-7575a6afc653",
            ContractType: "Prepaid",
            ContractStatus: "Active",
            ContractStartDate: "2024-01-01",
            ContractEndDate: "2024-12-31",
            TESTNEWVALUE: "TEST",
            TESTNEWVALUE2: "TEST2",
            TESTNEWVALUE3: false,
            TESTNEWVALUE4: true,
            TESTNEWVALUE5: "asdafasazxcvadfasfasfsafsafasffasfsafasfsafasfasfasfasfasf"
        },
        {
            name: "Test User 2",
            email: "TestUser1@test.test",
            password: "N/A",
            msisdn: "011111115511"
        },
        {
            name: "Test User 3",
            email: "TestUser2@test.test",
            password: "N/A",
            msisdn: "011111115511"
        }
    ],
    Testing: [
        {
            name: "Test User 1",
            email: "TestUser1@test.test",
            password: "N/A",
            msisdn: "01111111111"
        },
        {
            name: "Test User 2",
            email: "TestUser1@test.test",
            password: "N/A",
            msisdn: "011111115511"
        },
        {
            name: "Test User 3",
            email: "TestUser2@test.test",
            password: "N/A",
            msisdn: "011111115511"
        }
    ],
    Staging: [], // Empty for Staging environment
    Production: [
        {
            name: "Test User 1",
            email: "TestUser1@test.test",
            password: "N/A",
            msisdn: "01111111111"
        },
        {
            name: "Test User 2",
            email: "TestUser1@test.test",
            password: "N/A",
            msisdn: "011111115511"
        }
    ]
};

export default testData;