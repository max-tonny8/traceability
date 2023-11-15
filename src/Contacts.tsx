import React, { Dispatch, SetStateAction } from 'react';
import { Button, Form, Input, Modal, Select, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Web3 from 'web3';
import { ABI, CONTRACT_ADDRESS, PALTBLOCK_SERVICE_URL } from './Constants';
import { Utils } from './Utils';
import ColumnGroup from 'antd/es/table/ColumnGroup';
import Column from 'antd/es/table/Column';
import axios from 'axios';
import { Auth } from "aws-amplify";
import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider';
import AWS from 'aws-sdk';

const { Option } = Select;

interface Props {
    web3Account: string
}

interface DataType {
    _id: any;
    companyId: string;
    companyName: string;
    name: string;
    lastName: string;
    email: string;
    phone: string;
}

interface Values {
    companyId: string;
    name: string;
    lastName: string;
    email: string;
    phone: string;
}
  
interface ContactCreateFormProps {
    open: boolean;
    onCreate: (values: Values) => void;
    onCancel: () => void;
    companies: Array<any>
}
  
const ContactCreateForm: React.FC<ContactCreateFormProps> = ({open, onCreate, onCancel, companies}) => {
    const [form] = Form.useForm();

    return (
        <Modal
            open={open}
            title="Create a new contact"
            okText="Create"
            cancelText="Cancel"
            onCancel={onCancel}
            onOk={() => {
                form
                .validateFields()
                .then((values) => {
                    form.resetFields();
                    onCreate(values);
                })
                .catch((info) => {
                    console.log('Validate Failed:', info);
                });
            }}
        >
            <Form
                form={form}
                layout="vertical"
                name="form_in_modal"
                initialValues={{ modifier: 'public' }}
            >
                <Form.Item
                    name="companyId"
                    label="Select a company"
                    rules={[{ required: true, message: 'Please select a company!' }]}
                >
                    <Select placeholder="Please select a company">
                        {
                            companies.map((item, i) => (
                                <Option key={i} value={item.documentId}>{item.name}</Option> 
                            ))
                        }
                    </Select>
                </Form.Item>
                <Form.Item 
                    name="name" 
                    label="Name"
                    rules={[{ required: true, message: 'Please input the name!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="lastName" 
                    label="LastName"
                    rules={[{ required: true, message: 'Please input the lastname!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="email" 
                    label="Email"
                    rules={[{ required: true, message: 'Please input the email!' }]}
                >
                    <Input type='email'/>
                </Form.Item>
                <Form.Item 
                    name="phone" 
                    label="Phone"
                    rules={[{ required: true, message: 'Please input the phone!' }]}
                >
                    <Input/>
                </Form.Item>
            </Form>
        </Modal>
    );
};

const Contacts = (props: Props) => {
    const [contract, setContract] = React.useState<any>(undefined);
    const [openModal, setOpenModal] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [contacts, setContacts] = React.useState<Array<DataType>>([]);
    const [companies, setCompanies] = React.useState<Array<any>>([]);
  
    const onCreate = async (values: any) => {
        try {
            setLoading(true);

            values.companyName = companies.find(x => x.documentId === values.companyId)?.name || '';
            const token = (await Auth.currentSession()).getIdToken().getJwtToken();
            const result = await axios.post(PALTBLOCK_SERVICE_URL, values, {headers: { 'Authorization': ` Bearer ${token}`}});
            if (result.status === 200) {
                setOpenModal(false);
                loadContacts();
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setOpenModal(true);
    };

    const onDelete = async (value: DataType, index: number) => {
        try {
            setLoading(true);

            const token = (await Auth.currentSession()).getIdToken().getJwtToken();
            const result = await axios.delete(PALTBLOCK_SERVICE_URL, { data: { _id: value._id }, headers: { 'Authorization': ` Bearer ${token}`} });
            if (result.status === 200) {
                setOpenModal(false);
                loadContacts();
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    const loadContacts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(PALTBLOCK_SERVICE_URL);
            if (response.status == 200) {
                const contacts = JSON.parse(response.data.body);
                setContacts(contacts);
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    const loadCompanies = async () => {
        if (contract) {
            setLoading(true);
            const data = await contract.methods.getCompanies().call({from: props.web3Account});
            const _companies = data.map((item: any) => { 
                return {
                    documentId: item.documentId,
                    name: item.name,
                    location: item.location
                }
            })
            setCompanies(_companies);
            setLoading(false);
        }
    }

    React.useEffect(() => {
        loadCompanies();
    }, [contract])

    React.useEffect(() => {
        loadContacts();
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum as any);
            const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
            setContract(contract);
        }
    }, [])

    return (
        <div>
            <h1>Contacts</h1>
            {
                loading &&
                <div className='spinner-cover'>
                    <Spin spinning={loading}/>
                </div>
            }
            <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
                Add a contact
            </Button>
            <Table dataSource={contacts}>
                <Column title="Company ID" dataIndex="companyId" key="companyId" render={(text) => <a>{text}</a>}/>
                <Column title="Company Name" dataIndex="companyName" key="companyName" render={(text) => <a>{text}</a>}/>
                <Column title="Name" dataIndex="name" key="name"/>
                <Column title="LastName" dataIndex="lastName" key="lastName"/>
                <Column title="Email" dataIndex="email" key="email"/>
                <Column title="Phone" dataIndex="phone" key="phone"/>
                <Column title="Action" key="action" render={(_, record, index) => (
                    <Space size="middle">
                        <a onClick={() => onDelete(_, index)}>Delete</a>
                    </Space>
                )}/>
            </Table>
            <ContactCreateForm open={openModal} onCreate={onCreate} onCancel={() => setOpenModal(false)} companies={companies}/>
        </div>
    )
}

export default Contacts;