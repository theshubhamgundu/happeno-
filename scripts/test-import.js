const fetch = require('node-fetch'); // Make sure node-fetch is installed, or run this script in an environment with global fetch

const mockPayload = {
  registrations: [
    {
      participants: [
        { fullName: "Alice Smith", email: "alice@example.com", phone: "1234567890", college: "ABC Tech" }
      ],
      track: "General",
      problemStatement: "A solo AI agent for debugging."
    },
    {
      participants: [
        { fullName: "Bob Jones", email: "bob@example.com", phone: "2234567890", college: "XYZ College" },
        { fullName: "Charlie Brown", email: "charlie@example.com", phone: "3234567890", college: "XYZ College" }
      ],
      track: "General",
      problemStatement: "A duo crypto wallet."
    },
    {
      participants: [
        { fullName: "Dave Miller", email: "dave@example.com", phone: "4234567890", college: "Def Uni" },
        { fullName: "Eve Davis", email: "eve@example.com", phone: "5234567890", college: "Def Uni" },
        { fullName: "Frank Wilson", email: "frank@example.com", phone: "6234567890", college: "Def Uni" },
        { fullName: "Grace Taylor", email: "grace@example.com", phone: "7234567890", college: "Def Uni" }
      ],
      track: "General",
      problemStatement: "A massive IoT mesh network."
    }
  ]
};

async function testImport() {
  console.log("Submitting mock data dump to import API...");
  const res = await fetch('http://localhost:3000/api/admin/import-registrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mockPayload)
  });
  const data = await res.json();
  console.log("Import Response:", data);

  console.log("Generating passwords...");
  const res2 = await fetch('http://localhost:3000/api/admin/generate-passwords', {
    method: 'POST'
  });
  const data2 = await res2.json();
  console.log("Generate Passwords Response:", data2);
}

testImport();
