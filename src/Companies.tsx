import React, { Dispatch, SetStateAction } from 'react';
import { Button, Form, Input, Modal, Select, Space, Spin, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Web3 from 'web3';
import { ABI, CONTRACT_ADDRESS } from './Constants';
import { Utils } from './Utils';
import ColumnGroup from 'antd/es/table/ColumnGroup';
import Column from 'antd/es/table/Column';

const { Option } = Select;

interface Props {
    web3Account: string
}

interface DataType {
    documentId: string;
    name: string;
    location: string;
}

interface Values {
    title: string;
    description: string;
    modifier: string;
}
  
interface CompanyCreateFormProps {
    open: boolean;
    onCreate: (values: Values) => void;
    onCancel: () => void;
}
  
const CompanyCreateForm: React.FC<CompanyCreateFormProps> = ({open, onCreate, onCancel}) => {
    const [form] = Form.useForm();

    return (
        <Modal
            open={open}
            title="Create a new company"
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
                    name="documentId"
                    label="Document ID"
                    rules={[{ required: true, message: 'Please input the document id of company!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="name" 
                    label="Name"
                    rules={[{ required: true, message: 'Please input the name of company!' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item 
                    name="location" 
                    label="Location"
                    rules={[{ required: true, message: 'Please input the location of company!' }]}
                >
                    <Input type="textarea" />
                </Form.Item>
                <Form.Item
                    name="processes"
                    label="Select processes [multiple]"
                    rules={[{ required: true, message: 'Please select the processes of company!', type: 'array' }]}
                >
                    <Select mode="multiple" placeholder="Please select processes">
                        <Option value={1}>Seed Process</Option>
                        <Option value={2}>Graft Process</Option>
                        <Option value={3}>Avocado Process</Option>
                        <Option value={4}>Packaging Process</Option>
                        <Option value={5}>Distribution Process</Option>
                        <Option value={6}>Avocado Sales Process</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

const Companies = (props: Props) => {
    const [contract, setContract] = React.useState<any>(undefined);
    const [openModal, setOpenModal] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [companies, setCompanies] = React.useState<Array<DataType>>([]);
  
    const onCreate = async (values: any) => {
        if (contract) {
            try {
                setLoading(true);
                await contract.methods.insertCompany(values.documentId, values.location, values.name, values.processes).send({from: props.web3Account});
                loadCompanies();
            } catch (error: any) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
        }
        setOpenModal(false);
    };

    const handleAdd = () => {
        setOpenModal(true);
    };

    const onDelete = async (value: DataType, index: number) => {
        if (contract) {
            try {
                setLoading(true);
                await contract.methods.deleteCompany(index, value.documentId).send({from: props.web3Account});
                loadCompanies();
            } catch (error: any) {
                alert(error.message);
            } finally {
                setLoading(false);
            }
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
            }})
            setCompanies(_companies);
            setLoading(false);
            // const provider = new ethers.BrowserProvider(window.ethereum);
            // const signer = await provider.getSigner();
            // const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        }
    }

    React.useEffect(() => {
        loadCompanies();
    }, [contract])

    React.useEffect(() => {
        if (window.ethereum ) {
            const web3 = new Web3(window.ethereum as any);
            const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
            setContract(contract);
        }
    }, [])

    return (
        <div>
            <h1>Companies</h1>
            {
                loading &&
                <div className='spinner-cover'>
                    <Spin spinning={loading}/>
                </div>
            }
            <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
                Add a company
            </Button>
            {/* {props.web3Account} */}
            <Table dataSource={companies}>
                <Column title="Document ID" dataIndex="documentId" key="documentId" render={(text) => <a>{text}</a>}/>
                <Column title="Name" dataIndex="name" key="name"/>
                <Column title="Location" dataIndex="location" key="location"/>
                <Column title="Action" key="action" render={(_, record, index) => (
                    <Space size="middle">
                        <a onClick={() => onDelete(_, index)}>Delete</a>
                    </Space>
                )}/>
            </Table>
            <CompanyCreateForm open={openModal} onCreate={onCreate} onCancel={() => setOpenModal(false)}/>
        </div>
    )
}

export default Companies;