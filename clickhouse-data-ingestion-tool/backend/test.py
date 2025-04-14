import unittest
import json
import os
from app import app

class DataIngestionToolTest(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        
        # Create a test CSV file
        with open('test_data.csv', 'w') as f:
            f.write('id,name,age,city\n')
            f.write('1,Test User,30,Test City\n')
            f.write('2,Another User,25,Another City\n')
    
    def tearDown(self):
        # Remove test files
        if os.path.exists('test_data.csv'):
            os.remove('test_data.csv')
        if os.path.exists('test_output.csv'):
            os.remove('test_output.csv')
    
    def test_get_flatfile_columns(self):
        """Test flat file column retrieval"""
        response = self.app.post('/api/get-flatfile-columns',
                                 data=json.dumps({
                                     'filePath': 'test_data.csv',
                                     'delimiter': ','
                                 }),
                                 content_type='application/json')
        
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['columns']), 4)
        self.assertEqual(data['columns'][0]['name'], 'id')
        self.assertEqual(data['columns'][1]['name'], 'name')
        self.assertEqual(data['columns'][2]['name'], 'age')
        self.assertEqual(data['columns'][3]['name'], 'city')
    
    def test_preview_data_flatfile(self):
        """Test flat file data preview"""
        response = self.app.post('/api/preview-data',
                                 data=json.dumps({
                                     'sourceType': 'flatfile',
                                     'filePath': 'test_data.csv',
                                     'delimiter': ',',
                                     'selectedColumns': ['id', 'name', 'age', 'city']
                                 }),
                                 content_type='application/json')
        
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['columns']), 4)
        self.assertEqual(len(data['data']), 2)  # 2 data rows
    
    def test_clickhouse_connection_error(self):
        """Test handling of ClickHouse connection errors"""
        response = self.app.post('/api/connect-clickhouse',
                                 data=json.dumps({
                                     'host': 'nonexistent-host',
                                     'port': 9000,
                                     'database': 'default',
                                     'user': 'default',
                                     'jwt_token': ''
                                 }),
                                 content_type='application/json')
        
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)

if __name__ == '__main__':
    unittest.main() 