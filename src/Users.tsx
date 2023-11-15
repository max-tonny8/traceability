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
    username: string;
    email: string;
    name: string;
    family_name: string;
    phone_number: string;
    documentId: string;
    address: string;
}

interface Values {
    username: string;
    email: string;
    name: string;
    family_name: string;
    phone_number: string;
    documentId: string;
    address: string;
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
            title="Create a new user"
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
                    name="username" 
                    label="Username"
                    rules={[{ required: true, message: 'Please input the username!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="email" 
                    label="Email"
                    rules={[{ required: true, message: 'Please input the email!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="name" 
                    label="Name"
                    rules={[{ required: true, message: 'Please input the name!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="family_name" 
                    label="Lastname"
                    rules={[{ required: true, message: 'Please input the Lastname!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="documentId" 
                    label="Document ID"
                    rules={[{ required: true, message: 'Please input the document id!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="phone_number" 
                    label="Phone number"
                    rules={[{ required: true, message: 'Please input the phone!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="address" 
                    label="Address"
                    rules={[{ required: true, message: 'Please input the address!' }]}
                >
                    <Input type='textarea'/>
                </Form.Item>
            </Form>
        </Modal>
    );
};

const Users = (props: Props) => {
    const [contract, setContract] = React.useState<any>(undefined);
    const [openModal, setOpenModal] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [users, setUsers] = React.useState<Array<DataType>>([]);
    const [companies, setCompanies] = React.useState<Array<any>>([]);
  
    const onCreate = async (values: DataType) => {
        setLoading(true);
        const session = await Auth.currentCredentials();
        const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({region: 'us-east-1', credentials: session});
        await cognitoIdentityServiceProvider.adminCreateUser({
            UserPoolId: 'us-east-1_rQgxWV90D',
            Username: values.username, 
            UserAttributes: [
                { Name: 'email', Value: values.email },
                { Name: 'name', Value: values.name },
                { Name: 'family_name', Value: values.family_name },
                { Name: 'phone_number', Value: `+51${values.phone_number}` },
                { Name: 'custom:address', Value: `${values.address}` },
                { Name: 'custom:documentId', Value: `${values.documentId}` },
            ],
            DesiredDeliveryMediums: ['EMAIL']
        }, (err, data) => {
            if (err) {
                console.log(err);
                alert(err.message);
                setLoading(false);
                setOpenModal(false);
                return;
            }
            if (data.User) {
                setLoading(false);
                setOpenModal(false);
                loadUsers();
            }
        });
    };

    const handleAdd = () => {
        setOpenModal(true);
    };

    const onDelete = async (value: DataType, index: number) => {
        if (value.email === 'jerson.miranda@outlook.es') {
            alert('Can´t delete this user');
            return;
        }
        setLoading(true);
        const session = await Auth.currentCredentials();
        const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({region: 'us-east-1', credentials: session});
        cognitoIdentityServiceProvider.adminDeleteUser({ 
            UserPoolId: 'us-east-1_rQgxWV90D', 
            Username: value.username 
        }, (err, data) => {
            if (err) {
                console.log(err);
                alert(err.message);
                setLoading(false);
                setOpenModal(false);
                return;
            }
            setLoading(false);
            setOpenModal(false);
            loadUsers();
        });
    }

    const loadUsers = async () => {
        // Auth.signOut();
        const session = await Auth.currentCredentials();
        // AWS.config.update({
        //     region: 'us-east-1',
        //     credentials: new AWS.CognitoIdentityCredentials({
        //       IdentityPoolId: 'us-east-1:e7622daa-1cea-4548-a8fb-0c80eed9afbd',
        //       Logins: {
        //           'cognito-idp.us-east-1.amazonaws.com/us-east-1_rQgxWV90D': token,
        //       }
        //     })
        // });
        const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({region: 'us-east-1', credentials: session});
        cognitoIdentityServiceProvider.listUsers({UserPoolId: 'us-east-1_rQgxWV90D'}, (err, data) => {
            if (err) {
                console.log(err);
                alert(err.message);
                return;
            }
            if (data.Users) {
                const users: any = data.Users.map((x) => {
                    let attributes: any = {};
                    const _attributes = x.Attributes || [];
                    for(const attribute of _attributes) {
                        attributes[attribute.Name] = attribute.Value;
                    }
                    console.log(x);
                    return {
                        username: x.Username,
                        email: attributes.email || '',
                        name: attributes.name || '',
                        family_name: attributes.family_name || '',
                        phone_number: attributes.phone_number || ''
                    }
                })
                setUsers(users)
            }
        });
    }

    // const loadCompanies = async () => {
    //     if (contract) {
    //         setLoading(true);
    //         const data = await contract.methods.getCompanies().call({from: props.web3Account});
    //         const _companies = data.map((item: any) => { 
    //             return {
    //                 documentId: item.documentId,
    //                 name: item.name,
    //                 location: item.location
    //             }
    //         })
    //         setCompanies(_companies);
    //         setLoading(false);
    //     }
    // }

    // React.useEffect(() => {
    //     loadCompanies();
    // }, [contract])

    React.useEffect(() => {
        loadUsers();
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum as any);
            const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
            setContract(contract);
        }
    }, [])

    return (
        <div>
            <h1>Users</h1>
            {
                loading &&
                <div className='spinner-cover'>
                    <Spin spinning={loading}/>
                </div>
            }
            <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
                Add a user
            </Button>
            <Table dataSource={users}>
                <Column title="Username" dataIndex="username" key="username" render={(text) => <a>{text}</a>}/>
                <Column title="Email" dataIndex="email" key="email" render={(text) => <a>{text}</a>}/>
                <Column title="Name" dataIndex="name" key="name"/>
                <Column title="LastName" dataIndex="family_name" key="family_name"/>
                {/* <Column title="Document ID" dataIndex="phone_number" key="phone_number"/> */}
                <Column title="Phone" dataIndex="phone_number" key="phone_number"/>
                {/* <Column title="Address" dataIndex="phone_number" key="phone_number"/> */}
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

export default Users;